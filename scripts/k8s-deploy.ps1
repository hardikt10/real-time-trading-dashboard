param(
  [string]$BackendImage = "trading-dashboard-backend:latest",
  [string]$FrontendImage = "trading-dashboard-frontend:latest",
  [switch]$BuildImages
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
  throw "kubectl is not installed or not available on PATH. Install kubectl first."
}

if ($BuildImages -and -not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker is required for -BuildImages but is not installed or not available on PATH."
}

if ($BuildImages) {
  Write-Host "Building backend image $BackendImage..."
  & docker build -t $BackendImage .\backend

  Write-Host "Building frontend image $FrontendImage..."
  & docker build -t $FrontendImage .\frontend
}

Write-Host "Deploying Kubernetes resources from k8s/ ..."
& kubectl apply -k .\k8s

Write-Host "Updating deployment images..."
& kubectl -n trading-dashboard set image deployment/trading-dashboard-backend backend=$BackendImage
& kubectl -n trading-dashboard set image deployment/trading-dashboard-frontend frontend=$FrontendImage
