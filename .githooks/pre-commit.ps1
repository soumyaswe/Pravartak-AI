param()

# Simple pre-commit secret scanner (PowerShell)
$ErrorActionPreference = 'SilentlyContinue'

# Patterns to flag as potential secrets
$patterns = @(
  'AIza',                # Google API key prefix
  'sk-[A-Za-z0-9_\-]{20,}',
  'ghp_[A-Za-z0-9_\-]{10,}',
  'AKIA[A-Z0-9]{8,}',
  'BEGIN PRIVATE KEY',
  'BEGIN RSA PRIVATE KEY',
  '"private_key"',
  'client_email',
  'client_id',
  'DATABASE_URL=',
  'NEXT_PUBLIC_FIREBASE_API_KEY=',
  'GEMINI_API_KEY='
)

Write-Host "Running pre-commit secret scanner..." -ForegroundColor Cyan

$excludes = @('.git','node_modules','.next','backups','secrets_backup','.githooks')

$found = @()

Get-ChildItem -Recurse -File | ForEach-Object {
    $path = $_.FullName
    if ($excludes | ForEach-Object { $path -like "*$_*" } | Where-Object {$_}) { return }
    try {
        $content = Get-Content -Raw -LiteralPath $path -ErrorAction Stop
    } catch { return }
    foreach ($p in $patterns) {
        if ($p -match '^[A-Za-z0-9]') {
            # treat simple literal patterns
            if ($content -match [regex]::Escape($p)) { $found += "$path : $p"; break }
        } else {
            # treat regex-like patterns
            if ($content -match $p) { $found += "$path : matched pattern $p"; break }
        }
    }
}

if ($found.Count -gt 0) {
    Write-Host "Potential secrets detected in the following files:" -ForegroundColor Red
    $found | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
    Write-Host "\nCommit aborted. Remove secrets or add a legitimate exception." -ForegroundColor Red
    exit 1
} else {
    Write-Host "No obvious secrets found." -ForegroundColor Green
    exit 0
}
