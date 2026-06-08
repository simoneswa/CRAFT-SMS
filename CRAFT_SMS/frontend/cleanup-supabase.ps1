# PowerShell script to remove Supabase imports from frontend files

$BaseDir = "c:\Users\Swaray\OneDrive\Desktop\craft sms\CRAFT_SMS\frontend"
$FilesToClean = @(
    "src/app/dashboard/analytics/page.tsx",
    "src/app/dashboard/announcements/page.tsx",
    "src/app/dashboard/status/page.tsx",
    "src/app/dashboard/tenants/page.tsx",
    "src/app/forgot-password/page.tsx",
    "src/app/signup/page.tsx",
    "src/app/[subdomain]/dashboard/academic/page.tsx",
    "src/app/[subdomain]/dashboard/attendance/page.tsx",
    "src/app/[subdomain]/dashboard/finance/page.tsx",
    "src/app/[subdomain]/dashboard/gamification/page.tsx",
    "src/app/[subdomain]/dashboard/gradebook/page.tsx",
    "src/app/[subdomain]/dashboard/grades/page.tsx",
    "src/app/[subdomain]/dashboard/messages/page.tsx",
    "src/app/[subdomain]/dashboard/news/page.tsx",
    "src/components/admin/SuperAdminOverview.tsx"
)

$CleanedCount = 0

foreach ($File in $FilesToClean) {
    $FullPath = Join-Path $BaseDir $File
    
    if (-not (Test-Path $FullPath)) {
        Write-Warning "File not found: $File"
        continue
    }
    
    try {
        $Content = Get-Content $FullPath -Raw -Encoding UTF8
        
        # Store original for comparison
        $OriginalContent = $Content
        
        # Remove lines containing "supabase" import using split and filter
        $Lines = $Content -split "`n"
        $FilteredLines = @()
        
        foreach ($Line in $Lines) {
            # Skip lines that contain both "import" and "supabase"
            if ($Line -match "import" -and $Line -match "supabase") {
                continue
            }
            $FilteredLines += $Line
        }
        
        $Content = $FilteredLines -join "`n"
        
        # Only write if changes were made
        if ($Content -ne $OriginalContent) {
            Set-Content $FullPath $Content -Encoding UTF8
            Write-Host "OK Cleaned: $File"
            $CleanedCount++
        } else {
            Write-Host "SKIP: $File"
        }
    }
    catch {
        Write-Error "Error processing $File : $_"
    }
}

Write-Host "`nTotal files cleaned: $CleanedCount"
