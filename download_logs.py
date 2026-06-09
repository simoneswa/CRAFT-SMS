import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# 1. Fetch jobs
jobs_url = "https://api.github.com/repos/simoneswa/CRAFT-SMS/actions/runs/27034250072/jobs"
req = urllib.request.Request(jobs_url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, context=ctx) as response:
    jobs_data = json.loads(response.read().decode())

job_id = None
for job in jobs_data.get('jobs', []):
    if job['name'] == 'deploy':
        job_id = job['id']
        break

if not job_id:
    print("Could not find deploy job.")
    exit(1)

# 2. Fetch logs
logs_url = f"https://api.github.com/repos/simoneswa/CRAFT-SMS/actions/jobs/{job_id}/logs"
req_logs = urllib.request.Request(logs_url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req_logs, context=ctx) as response:
        logs_text = response.read().decode('utf-8')
        with open('job_logs.txt', 'w', encoding='utf-8') as f:
            f.write(logs_text)
        print("Logs downloaded successfully.")
except Exception as e:
    print("Error fetching logs:", e)
