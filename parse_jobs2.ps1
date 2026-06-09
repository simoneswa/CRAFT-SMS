$data = Invoke-RestMethod -Uri 'https://api.github.com/repos/simoneswa/CRAFT-SMS/actions/runs/27034250072/jobs' -Headers @{'User-Agent'='PowerShell'}
foreach ($j in $data.jobs) {
    Write-Output ("Job: " + $j.name)
    foreach ($s in $j.steps) {
        Write-Output ("  Step: " + $s.name + " - " + $s.conclusion)
    }
}
