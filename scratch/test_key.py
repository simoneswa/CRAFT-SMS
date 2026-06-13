import urllib.request
import json

api_key = "AIzaSyA0DV6kD9T3JeS8DN8fIkUcg8qKE5J-iGc"
url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={api_key}"
data = json.dumps({"returnSecureToken": True}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')

try:
    with urllib.request.urlopen(req) as response:
        print("Success:", response.read().decode())
except urllib.error.HTTPError as e:
    error_body = e.read().decode()
    print("HTTPError:", e.code)
    print("Response:", error_body)
    if "MISSING_EMAIL" in error_body:
        print("API Key is VALID.")
    elif "API_KEY_INVALID" in error_body:
        print("API Key is INVALID.")
except Exception as e:
    print("Error:", e)
