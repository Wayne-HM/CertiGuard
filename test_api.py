import requests

url = "https://certiguard-ksm9.onrender.com/verify"

try:
    with open('pytest.pdf', 'wb') as f:
        f.write(b'%PDF-1.4\nTest PDF')
    
    with open('pytest.pdf', 'rb') as f:
        files = {'certificate': f}
        data = {'platform': 'auto'}
        print("Sending POST to:", url)
        response = requests.post(url, files=files, data=data)
        
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Failed: {e}")
