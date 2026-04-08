import requests
import json

url = "http://localhost:8000/api/ai/validate-rfp"
files = {'file': ('test.txt', b'hello world')}
data = {'tender_data_json': json.dumps({"test": "data"})}

try:
    response = requests.post(url, files=files, data=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
