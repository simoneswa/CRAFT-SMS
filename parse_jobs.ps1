$data = Get-Content jobs.json -Raw | ConvertFrom-Json
foreach ($j in $data.jobs) {
    Write-Output ("Job: " + $j.name)
    foreach ($s in $j.steps) {
        Write-Output ("  Step: " + $s.name + " - " + $s.conclusion)
    }
}
