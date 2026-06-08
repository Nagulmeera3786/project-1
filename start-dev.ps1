param(
    [int]$BackendPort = 8000,
    [switch]$UseSqlite
)

$ErrorActionPreference = 'Stop'

$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $rootPath 'backend'
$frontendPath = Join-Path $rootPath 'frontend'
$venvActivatePath = Join-Path $backendPath '.venv\Scripts\Activate.ps1'

if (-not (Test-Path $backendPath)) {
    throw "Backend folder not found: $backendPath"
}

if (-not (Test-Path $frontendPath)) {
    throw "Frontend folder not found: $frontendPath"
}

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    throw 'Python is not installed or not available in PATH.'
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw 'npm is not installed or not available in PATH.'
}

if (-not (Test-Path $venvActivatePath)) {
    Write-Host 'Creating backend virtual environment at backend/.venv ...' -ForegroundColor Yellow
    & python -m venv (Join-Path $backendPath '.venv')
}

$backendRunMode = if ($UseSqlite) { 'sqlite' } else { 'default' }

$backendCommand = @"
Set-Location '$backendPath'
`$ErrorActionPreference = 'Stop'

if (Test-Path '.\.venv\Scripts\Activate.ps1') {
    . .\.venv\Scripts\Activate.ps1
}

if (-not (Test-Path '.\.venv\.deps_installed')) {
    python -m pip install --upgrade pip
    python -m pip install -r requirements.txt
    New-Item -Path '.\.venv\.deps_installed' -ItemType File -Force | Out-Null
}

if ('$backendRunMode' -eq 'sqlite') {
    python manage.py migrate --settings=project.settings_sqlite_dump
    python manage.py runserver 0.0.0.0:$BackendPort --settings=project.settings_sqlite_dump
} else {
    python manage.py migrate
    python manage.py runserver 0.0.0.0:$BackendPort
}
"@

$frontendCommand = @"
Set-Location '$frontendPath'
`$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.\node_modules')) {
    npm install
}

npm start
"@

Write-Host 'Starting backend terminal...' -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $backendCommand | Out-Null

Write-Host 'Starting frontend terminal...' -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $frontendCommand | Out-Null

Write-Host ''
Write-Host "Backend:  http://localhost:$BackendPort" -ForegroundColor Green
Write-Host 'Frontend: http://localhost:3000' -ForegroundColor Green
Write-Host ''
Write-Host 'Tips:' -ForegroundColor Yellow
Write-Host '  - If PostgreSQL is not ready, run with: .\start-dev.ps1 -UseSqlite'
Write-Host '  - Close the two opened terminals to stop the servers.'
