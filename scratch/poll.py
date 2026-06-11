import time
import urllib.request
import sys

start = time.time()
print("Polling started...")
while time.time() - start < 600:
    try:
        req = urllib.request.Request(
            'https://craft-sms-5bb1c.web.app/',
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        r = urllib.request.urlopen(req)
        html = r.read().decode('utf-8', errors='ignore')
        
        if 'There was no index.html found' not in html:
            print('Deployment successful! Page no longer shows default 404.')
            sys.exit(0)
        else:
            print('Still showing Firebase 404...')
    except urllib.error.HTTPError as e:
        print(f"HTTPError: {e.code} - {e.reason}")
    except Exception as e:
        print(f"Error: {e}")
    time.sleep(15)

print("Done polling. Timeout reached.")
sys.exit(1)
