$jobsUrl = 'https://api.github.com/repos/simoneswa/CRAFT-SMS/actions/runs/27034250072/jobs'
$jobsData = Invoke-RestMethod -Uri $jobsUrl -Headers @{'User-Agent'='PowerShell'}
$deployJob = $jobsData.jobs | Where-Object { $_.name -eq 'deploy' }
$jobId = $deployJob.id

$logsUrl = "https://api.github.com/repos/simoneswa/CRAFT-SMS/actions/jobs/$jobId/logs"
Invoke-RestMethod -Uri $logsUrl -Headers @{'User-Agent'='PowerShell'} -OutFile 'job_logs.txt'
