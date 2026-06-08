$files = @(
    'src/app/[subdomain]/dashboard/academic/page.tsx',
    'src/app/[subdomain]/dashboard/attendance/page.tsx',
    'src/app/[subdomain]/dashboard/finance/page.tsx',
    'src/app/[subdomain]/dashboard/gamification/page.tsx',
    'src/app/[subdomain]/dashboard/gradebook/page.tsx',
    'src/app/[subdomain]/dashboard/grades/page.tsx',
    'src/app/[subdomain]/dashboard/messages/page.tsx',
    'src/app/[subdomain]/dashboard/news/page.tsx'
)

$totalCleaned = 0

foreach ($file in $files) {
    $filePath = Join-Path (Get-Location) $file
    
    if (Test-Path $filePath) {
        $content = Get-Content -Path $filePath -Raw
        $originalLength = $content.Length
        
        # Remove lines that contain both "import" and "supabase"
        $lines = $content -split "`n"
        $cleanedLines = $lines | Where-Object { -not ($_ -match "import" -and $_ -match "supabase") }
        $cleaned = $cleanedLines -join "`n"
        
        # Only write if changed
        if ($cleaned.Length -ne $originalLength) {
            Set-Content -Path $filePath -Value $cleaned -Encoding UTF8
            Write-Host "✓ Cleaned: $file"
            $totalCleaned++
        } else {
            Write-Host "✓ Already clean: $file"
        }
    } else {
        Write-Host "✗ File not found: $file"
    }
}

Write-Host ""
Write-Host "Total files cleaned: $totalCleaned"
