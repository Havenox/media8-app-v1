$ErrorActionPreference = "Stop"

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
        Write-Host $_.Exception.Message
        return $null
    }
}

# 1. Wait for Backend
Write-Host "Waiting for Backend to be ready..."
$retries = 30
while ($retries -gt 0) {
    try {
        $res = Invoke-WebRequest "http://localhost:5261/api/v1/packages" -UseBasicParsing -ErrorAction Stop
        if ($res.StatusCode -eq 200) { break }
    } catch {
        Start-Sleep -Seconds 2
        $retries--
        Write-Host "." -NoNewline
    }
}
Write-Host ""
if ($retries -eq 0) { Write-Error "Backend failed to start." }

# 2. Login
$loginBody = @{
    email = "carlos@media8.com"
    password = "123" # Check seeded password
}
# Seeded password for Carlos might be 'Password123!' or '123456' from walkthrough?
# Walkthrough says '123456'.
$loginBody.password = "123456"

$auth = Test-Endpoint "Login (Carlos)" "http://localhost:5261/api/v1/auth/login" "POST" $loginBody
if (-not $auth) { exit 1 }

$token = $auth.token
$headers = @{ Authorization = "Bearer $token" }
$userId = $auth.user.id

Write-Host "Got Token for User ID: $userId"

# 3. Fetch Packages (Public)
$pkgs = Test-Endpoint "Fetch Packages" "http://localhost:5261/api/v1/packages"
if ($pkgs.Count -eq 0) { Write-Warning "No packages found!" }

# 4. Fetch Service Balances (Authorized)
$balances = Test-Endpoint "Fetch Balances" "http://localhost:5261/api/v1/users/$userId/service-balances" "GET" $null $headers

Write-Host "Integration Tests Completed!" -ForegroundColor Cyan
