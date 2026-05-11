param(
  [switch]$Detach
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker is not installed or not available on PATH. Install Docker Desktop or Docker Engine first."
}

$composeArgs = @("compose", "up", "--build")
if ($Detach) {
  $composeArgs += "-d"
}

Write-Host "Starting trading dashboard with Docker Compose..."
& docker @composeArgs
