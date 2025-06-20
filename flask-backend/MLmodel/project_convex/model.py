from qdrant_client.models import Distance, VectorParams, PointStruct
from langchain_text_splitters import RecursiveCharacterTextSplitter
from qdrant_client import QdrantClient
import pymupdf
import llama_cpp
import uuid
from openai import OpenAI


template = """
You are a helpful assistant who answers questions using the provided context. If you don't know the answer, 
simply state that you don't know. Try to keep your answer short and precise, don't exceed 150 words.

{context}

Question: {question}"""

qdrant_client = QdrantClient(host="localhost", port=6333)

llm_client = OpenAI(base_url="http://localhost:8080/v1", api_key="abcd")

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=300,
    chunk_overlap=50,
    length_function=len,
    is_separator_regex=False
)

embedding_model = llama_cpp.Llama(
    model_path="MLmodel/project_convex/models/mxbai-embed-large-v1-f16.gguf",
    embedding=True,
    verbose=False,
)


def pdf_to_documents(arr_docs):
    text = ""
    for doc in arr_docs:
        # Extract all the text from the pdf document
        for page in doc:
            result = page.get_text()
            text += result

    return text_splitter.create_documents([text])


def generate_doc_embeddings(_documents):
    local_document_embeddings = []
    # Generate Embeddings for every single document in documents and append it into document_embeddings
    for document in _documents:
        embeddings = embedding_model.create_embedding([document.page_content])
        local_document_embeddings.extend([
            (document, embeddings["data"][0]["embedding"])
        ])

    return local_document_embeddings


def insert_in_db(_document_embeddings):
    # If collection VectorDB exists then delete
    if qdrant_client.collection_exists(collection_name="VectorDB"):
        qdrant_client.delete_collection(collection_name="VectorDB")

    qdrant_client.create_collection(
        collection_name="VectorDB",
        vectors_config=VectorParams(size=1024, distance=Distance.COSINE),
    )

    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=embeddings,
            payload={
                "text": document.page_content
            }
        )
        for document, embeddings in _document_embeddings
    ]

    operation_info = qdrant_client.upsert(
        collection_name="VectorDB",
        wait=True,
        points=points
    )

    print("\n")
    print("operation_info: ")
    print(operation_info)


def vector_search(_search_query):
    query_vector = embedding_model.create_embedding(_search_query)['data'][0]['embedding']
    search_result = qdrant_client.search(
        collection_name="VectorDB",
        query_vector=query_vector,
        limit=3
    )

    print("\n")
    print("search_result: ")
    print(search_result)

    context = "".join([row.payload['text'] for row in search_result])
    context = context.replace('\n', ' ')

    _messages = [
        {"role": "user", "content": template.format(
            context=context,
            question=_search_query
        )}
    ]

    print("\n")
    print("Prompt: ")
    print(_messages[0]["content"])
    return _messages


def query(_messages):
    response = llm_client.chat.completions.create(
        model="Phi-3.5-Instruct",
        messages=_messages,
        stream=True
    )

    for chunk in response:
        if chunk.choices[0].delta.content is not None:
            yield chunk.choices[0].delta.content


def insert_pdf_vectordb(_arr_docs):
    documents = pdf_to_documents(_arr_docs)

    document_embeddings = generate_doc_embeddings(documents)

    insert_in_db(document_embeddings)
