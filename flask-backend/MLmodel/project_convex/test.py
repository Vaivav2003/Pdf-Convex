import requests

# URL of the server where you are sending the POST request
url = 'http://127.0.0.1:5000/question'

data = {"question": "what is the main idea?"}

response = requests.post(url, json=data)

if response.status_code == 200:
    print(response.json())
else:
    print("Error")
