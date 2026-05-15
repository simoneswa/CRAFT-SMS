# Read the file as raw bytes to handle encoding correctly
$bytes = [System.IO.File]::ReadAllBytes('.gitignore')

# Convert to UTF-8 string (the file should be UTF-8 except the last line)
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# Find the position of the garbage line - it starts with the UTF-16 BOM or null bytes
# The garbage line starts with "!" followed by null bytes (UTF-16 pattern: 21 00 43 00 ...)
# We split on newlines and filter out any line containing null bytes
$lines = $text -split "`r?`n"
$cleanLines = $lines | Where-Object { $_ -notmatch "\x00" -and $_ -ne "" -or $_ -eq "" }

# Actually, let's just keep lines up to the last valid line
$validLines = @()
foreach ($line in $lines) {
    # Skip lines that contain null characters (UTF-16 garbage)
    if ($line -notmatch "\x00") {
        $validLines += $line
    }
}

# Join and write back as UTF-8
$cleanContent = $validLines -join "`r`n"
$cleanContent = $cleanContent.TrimEnd() + "`r`n"
[System.IO.File]::WriteAllText('.gitignore', $cleanContent, [System.Text.Encoding]::UTF8)

Write-Host "Fixed. Last 5 lines:"
Get-Content '.gitignore' -Tail 5
