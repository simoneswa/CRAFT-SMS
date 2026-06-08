$basePath = "c:\Users\Swaray\OneDrive\Desktop\craft sms\CRAFT_SMS\frontend\src\app\[subdomain]\dashboard"
$files = @(
    "$basePath\academic\page.tsx",
    "$basePath\attendance\page.tsx",
    "$basePath\finance\page.tsx",
    "$basePath\gamification\page.tsx",
    "$basePath\gradebook\page.tsx",
    "$basePath\grades\page.tsx",
    "$basePath\messages\page.tsx",
    "$basePath\news\page.tsx"
)

$totalCleaned = 0

foreach ($file in $files) {
    if (Test-Path -LiteralPath $file) {
        $content = Get-Content -LiteralPath $file -Raw
        $lines = $content -split "`n"
        $cleanedLines = $lines | Where-Object { -not ($_ -match "import" -and $_ -match "supabase") }
        $cleaned = $cleanedLines -join "`n"
        
        Set-Content -LiteralPath $file -Value $cleaned -Encoding UTF8
        $filename = Split-Path $file -Leaf
        $parent = Split-Path (Split-Path $file -Parent) -Leaf
        Write-Host "✓ Cleaned: $parent/$filename"
        $totalCleaned++
    } else {
        Write-Host "✗ File not found: $file"
    }
}

Write-Host ""
Write-Host "Total files cleaned: $totalCleaned"
