$ErrorActionPreference = "Stop"

# ============================================
# MEDIA 8 - Integration Test Script
# ============================================
# This script tests the basic API functionality
# Environment variables can be overridden:
# - API_URL (default: http://localhost:5261)
# - TEST_EMAIL, TEST_PASSWORD (for login test)

$API_URL = $env:API_URL ?? "http://localhost:5261"
$API_BASE = "$API_URL/api/v1"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "MEDIA 8 - Integration Tests" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "API URL: $API_BASE" -ForegroundColor Gray
Write-Host ""

function Test-Endpoint {
param($Name, $Url, $Method="GET", $Body=$null, $Headers=@{})
Write-Host "Testing $Name..." -NoNewline
try {
if ($Body) {
$response = Invoke-RestMethod -Uri $Url -Method $Method -Body ($Body | ConvertTo-Json) -ContentType "application/json" -Headers $Headers
} else {
$response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers
}
Write-Host " PASS" -ForegroundColor Green
return $response
} catch {
Write-Host " FAIL" -ForegroundColor Red
Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
return $null
}
}

# 1. Wait for Backend
Write-Host ""
Write-Host "1. Waiting for Backend to be ready..." -ForegroundColor Yellow
_retries = 30
while ($retries -gt 0) {
try {
$res = Invoke-WebRequest "$API_BASE/packages" -UseBasicParsing -ErrorAction Stop
if ($res.StatusCode -eq 200) { break }
} catch {
Start-Sleep -Seconds 2
$retries--
Write-Host "." -NoNewline
}
}
Write-Host ""
if ($retries -eq 0) { Write-Error "Backend failed to start."; exit 1 }
Write-Host "Backend is ready!" -ForegroundColor Green
Write-Host ""

# 2. Login
Write-Host "2. Testing Authentication..." -ForegroundColor Yellow
$loginBody = @{
email = "admin@media8.com"
password = "Admin123!"
}

$auth = Test-Endpoint "Login (Admin)" "$API_BASE/auth/login" "POST" $loginBody
if (-not $auth) { exit 1 }

$token = $auth.token
$headers = @{ Authorization = "Bearer $token" }
$userId = $auth.user.id

Write-Host "Got Token for User ID: $userId" -ForegroundColor Gray
Write-Host ""

# 3. Fetch Packages (Public)
Write-Host "3. Testing Packages Endpoint..." -ForegroundColor Yellow
$pkgs = Test-Endpoint "Fetch Packages" "$API_BASE/packages"
if ($pkgs.Count -eq 0) { Write-Warning "No packages found!" }
Write-Host ""

# 4. Fetch Service Balances (Authorized)
Write-Host "4. Testing Service Balances Endpoint..." -ForegroundColor Yellow
$balances = Test-Endpoint "Fetch Balances" "$API_BASE/users/$userId/service-balances" "GET" $null $headers
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Integration Tests Completed!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
