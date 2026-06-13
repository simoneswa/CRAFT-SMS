import time
import urllib.request
import sys

start = time.time()
print("Polling started...")
while time.time() - start < 900:
    try:
        req = urllib.request.Request(
            'https://craft-sms-5bb1c.web.app/',
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        r = urllib.request.urlopen(req)
        html = r.read().decode('utf-8', errors='ignore')
        
        if 'About CRAFT' in html and 'bg-[#f4b400]' in html:
            print('Deployment successful! New UI features and footer found.')
            sys.exit(0)
        else:
            print('Still showing old version...')
    except urllib.error.HTTPError as e:
        print(f"HTTPError: {e.code} - {e.reason}")
    except Exception as e:
        print(f"Error: {e}")
    time.sleep(15)

print("Done polling. Timeout reached.")
sys.exit(1)
