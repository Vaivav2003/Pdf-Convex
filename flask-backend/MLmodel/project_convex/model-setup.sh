#!/bin/bash

mkdir models
cd models

wget https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1/resolve/main/gguf/mxbai-embed-large-v1-f16.gguf
cd ..

git clone https://github.com/ggerganov/llama.cpp.git
cd llama.cpp/models

wget https://huggingface.co/bartowski/Phi-3.5-mini-instruct-GGUF/resolve/main/Phi-3.5-mini-instruct-Q5_K_M.gguf
cd ..

make -j 8
