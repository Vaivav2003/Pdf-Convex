import React, { useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import uploadIcon from "./assets/upload-svgrepo-com.png";
import deleteIcon from "./assets/delete-svgrepo-com.png";
import downloadIcon from "./assets/download-svgrepo-com.png";
import sendIcon from "./assets/send-svgrepo-com.png";
import "./index.css";

const MAX_FILE_NAME_LENGTH = 10;

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [summaryText, setSummaryText] = useState([]);
  const navigate = useNavigate();
  const [fileHistory, setfileHistory ] = useState([]);
  const [selectChanged, setSelectChanged] = useState(false);

  const url = "http://127.0.0.1:5000";

  const tempUpdateFileHistory = (history)=>{
    const newArray = [...history];
    setfileHistory(newArray);
  }

  const updateHistory = () => {
    fetch(url+"/history", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then((jsonResponse) => {
      tempUpdateFileHistory(jsonResponse.history)
    })
    .catch((error) => console.error("Error during fetch:", error));
  };

  useEffect(() => {
    fetch(url+"/account", {
      method: "GET", // Specifies the HTTP method as GET
      headers: {
        "Content-Type": "application/json",
      },
      credentials : 'include',
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json(); // Parse the JSON from the response
    })
    .then((jsonResponse) => {
      console.log(jsonResponse)
      if(jsonResponse.error){
        navigate("/");
      }
      updateHistory()
    })
    .catch((error) => {
      console.error("Error during fetch:", error);
    });
  }, []);


  const handleFileUpload = (e) => {
    e.preventDefault();

    const form = e.target.form;
    const formdata = new FormData(form);

    fetch(url+"/upload", {
        method : 'POST',
        credentials : 'include',
        body : formdata
    }).then((response) => {
        if(!response.ok){
            throw new Error("Upload Unsuccessful");
        }
        return response.json();
    }).then((jsonResponse) => {
        console.log(jsonResponse);
        updateHistory();
    }).catch((e) => {
        console.error(`Error : ${e}`);
    });
  };

  const handleClearFiles = () => {
    setSelectedFiles([]);
  };

  const handleFileClick = (file_obj) => {
    if (!selectedFiles.find((f) => f.actual_pdf_name === file_obj.actual_pdf_name)) {
      setSelectedFiles([...selectedFiles, file_obj]);
      setSelectChanged(true);
    }
  };

  const askQuestion = async (e) => {
    const selected_names = selectedFiles.map((f) => f.pdf_name)

    try{
      if(selectChanged){
        const selectedResponse = await fetch(url+"/selected", {
          method : 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            'selected_pdf_files' : selected_names,
          }),
        });
        
        if(!selectedResponse.ok){
            throw new Error("Selection Unsuccessful");
        }
    
        const selectedJsonResponse = await selectedResponse.json();
        console.log(selectedJsonResponse);
        setSelectChanged(false);
      }

      const questionResponse = await fetch(url+"/question", {
        method : 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          'question' : chatInput,
        }),
      });
      
      if(!questionResponse.ok){
          throw new Error("Query Unsuccessful");
      }

      const reader = questionResponse.body.getReader();
      const decoder = new TextDecoder('utf-8')
      let answer = ''

      while(true){
        const {done, value} = await reader.read();
        if(done){
          console.log("Stream Complete");
          break;
        }
        // Decode and accumulate the streamed content
        answer += decoder.decode(value, {stream: true});
        const newArray = [...summaryText, chatInput, answer];
        setSummaryText(newArray);
      }
      setChatInput("");

    }catch(error){
      console.log(`Error : ${error}`);
    }
  }

  const handleChatInputChange = (e) =>{
    setChatInput(e.target.value);
  }

  const handleDeleteFile = (file_obj) => {
    fetch(url+`/delete/${file_obj._id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then((jsonResponse) => {
      console.log(jsonResponse);
      updateHistory();
      const newSelectedFiles = selectedFiles.filter((f) => f.actual_pdf_name !== file_obj.actual_pdf_name);
      setSelectedFiles(newSelectedFiles); // Set the new array after deletion
    }) // Refresh the history after deletion
    .catch((error) => console.error("Error during fetch:", error));
  };

  const truncateFileName = (fileName) => {
    if (fileName.length > MAX_FILE_NAME_LENGTH) {
      return fileName.substring(0, MAX_FILE_NAME_LENGTH) + "...";
    }
    return fileName;
  };

  const handleLogout = () => {
    // Logic for logging out
    console.log("Logging out...");
    fetch(url+"/logout", {
      method: "GET", // Specifies the HTTP method as GET
      headers: {
        "Content-Type": "application/json",
      },
      credentials : 'include'
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json(); // Parse the JSON from the response
    })
    .then((jsonResponse) => {
      console.log(jsonResponse)
      if(jsonResponse.message){
        navigate("/");
      }
    })
    .catch((error) => {
      console.error("Error during fetch:", error);
    });
  };

  return (
    <div className="container">
      <div className="column">
        <div className="upload">
          <h2>UPLOAD PDF</h2>
          <div className="uploaded_pdf">
            <ul>
              {fileHistory.map((file_obj, index) => (
                <li key={index} className="file-item">
                  <button
                    onClick={() => handleFileClick(file_obj)}
                    className={`file-button ${
                      selectedFiles.find((f) => f.actual_pdf_name === file_obj.actual_pdf_name)
                        ? "selected"
                        : ""
                    }`}
                  >
                    <span>{truncateFileName(file_obj.actual_pdf_name)}</span>
                    <a href={url+`/download/${file_obj._id}`}>
                    <img
                      src={downloadIcon}
                      alt="download"
                      className="download-icon"
                      onClick={(e) => {
                        e.stopPropagation();               
                      }}
                    />
                    </a>

                    <img
                      src={deleteIcon}
                      alt="delete"
                      className="delete-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file_obj);
                      }}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="icon_btn">
            <form>
              <input
                type="file"
                multiple
                accept="application/pdf"
                id="upload_pdf_btn"
                name="pdf_file"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="upload_pdf_btn"
                className="label_pdf_btn"
              >
                <img src={uploadIcon} height="25" width="25" alt="upload icon" />
                <span>Upload</span>
              </label>
            </form>
          </div>
        </div>
        <div className="select">
          <h2>SELECTED PDF</h2>
          <div className="selected_pdf">
            <ul>
              {selectedFiles.map((file_obj, index) => (
                <li key={index} className="file-item">
                  <button className="file-button selected">
                    <span>{truncateFileName(file_obj.actual_pdf_name)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <button onClick={handleClearFiles}>Clear</button>
          </div>
        </div>
      </div>

      <div className="chat">
        <div className="chat-header">
          <h1>PDF SUMMARIZER</h1>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
        <div className="summary">
          {summaryText.map((dialog, index) => {
          if (index % 2 === 0) {
            // Even index: question
            return <div key={index} className="question">{dialog}</div>;
          } else {
            // Odd index: answer
            return <div key={index} className="answer">{dialog}</div>;
          }
          })}
        </div>
        <div className="chatbox-container">
          <textarea
            id="chatbox"
            placeholder="Ask about the PDF..."
            value={chatInput}
            onChange={handleChatInputChange}
            rows="3"
          />
          <button className="send-button" onClick={askQuestion}>
             <img src={sendIcon} alt="send" className="send-icon" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
