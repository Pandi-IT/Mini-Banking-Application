# Corrected API Testing Suite for Banking Core
$baseUrl = "http://localhost:8082/api"
$headers = @{ "Content-Type" = "application/json" }

function Invoke-ApiRequest($Method, $Uri, $Headers, $Body) {
    try {
        $params = @{
            Method          = $Method
            Uri             = $Uri
            Headers         = $Headers
            UseBasicParsing = $true
        }
        if ($Body) { $params.Add("Body", $Body) }
        return Invoke-WebRequest @params
    }
    catch {
        return $_.Exception.Response
    }
}

function Show-Result($testName, $resp) {
    Write-Host "`n--- $testName ---" -ForegroundColor Cyan
    if ($resp -and $resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) {
        Write-Host "Success (Status: $($resp.StatusCode))" -ForegroundColor Green
        if ($resp.Content) {
            $resp.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
        }
    }
    else {
        $status = if ($resp) { $resp.StatusCode } else { "Unknown" }
        Write-Host "Failed (Status: $status)" -ForegroundColor Red
        if ($resp.Content) {
            try { $resp.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 } catch { Write-Host $resp.Content }
        }
    }
}

# 1. Test Registration
$regBody = @{
    fullName = "Test User"
    email    = "test-$((Get-Random)).user@example.com"
    password = "password123"
} | ConvertTo-Json
$regResp = Invoke-ApiRequest -Method Post -Uri "$baseUrl/auth/register" -Headers $headers -Body $regBody
Show-Result "Registration" $regResp
$userId = if ($regResp.StatusCode -lt 300) { ($regResp.Content | ConvertFrom-Json).data.id } else { $null }

# 2. Test Login
$loginBody = @{
    email    = ($regBody | ConvertFrom-Json).email
    password = "password123"
} | ConvertTo-Json
$loginResp = Invoke-ApiRequest -Method Post -Uri "$baseUrl/auth/login" -Headers $headers -Body $loginBody
Show-Result "Login" $loginResp
$token = if ($loginResp.StatusCode -lt 300) { ($loginResp.Content | ConvertFrom-Json).data.token } else { $null }

if (-not $token) { Write-Host "Skipping authenticated tests..." -ForegroundColor Yellow; exit }

$authHeaders = @{ 
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $token"
}

# 3. Test Account Creation
$accResp = Invoke-ApiRequest -Method Post -Uri "$baseUrl/accounts/$userId?type=SAVINGS" -Headers $authHeaders
Show-Result "Account Creation" $accResp
$accNum = if ($accResp.StatusCode -lt 300) { ($accResp.Content | ConvertFrom-Json).data.accountNumber } else { $null }
$accId = if ($accResp.StatusCode -lt 300) { ($accResp.Content | ConvertFrom-Json).data.id } else { $null }

# 4. Test Idempotency (Deposit)
if ($accNum) {
    $idemKey = "idem-$((Get-Random))"
    $idemHeaders = $authHeaders.Clone()
    $idemHeaders.Add("X-Idempotency-Key", $idemKey)
    $dep1 = Invoke-ApiRequest -Method Post -Uri "$baseUrl/transactions/deposit?accountNumber=$accNum&amount=500" -Headers $idemHeaders
    Show-Result "Deposit with Idempotency" $dep1
    $dep2 = Invoke-ApiRequest -Method Post -Uri "$baseUrl/transactions/deposit?accountNumber=$accNum&amount=500" -Headers $idemHeaders
    Show-Result "Duplicate Deposit (Should be 409)" $dep2
}

# 5. Test Caching (Fetch Balance twice)
if ($accNum) {
    Write-Host "`n--- Caching Test (Balance) ---" -ForegroundColor Cyan
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $bal1 = Invoke-ApiRequest -Method Get -Uri "$baseUrl/accounts/$accNum/balance" -Headers $authHeaders
    $sw.Stop(); Write-Host "Call 1: $($sw.ElapsedMilliseconds)ms"
    $sw.Restart()
    $bal2 = Invoke-ApiRequest -Method Get -Uri "$baseUrl/accounts/$accNum/balance" -Headers $authHeaders
    $sw.Stop(); Write-Host "Call 2 (Cached): $($sw.ElapsedMilliseconds)ms"
    Show-Result "Balance Check" $bal2
}

# 6. Test Pagination (History)
if ($accId) {
    $histResp = Invoke-ApiRequest -Method Get -Uri "$baseUrl/transactions/account/$accId?page=0&size=2" -Headers $authHeaders
    Show-Result "Transaction History (Paginated)" $histResp
}

# 7. Test Rate Limiting
Write-Host "`n--- Rate Limiting Test ---" -ForegroundColor Cyan
for ($i = 1; $i -le 11; $i++) {
    $r = Invoke-ApiRequest -Method Post -Uri "$baseUrl/auth/login" -Headers $headers -Body $loginBody
    if ($r.StatusCode -eq 429) { Write-Host "Request ${i}: Rate Limited (429)" -ForegroundColor Green; break }
    else { Write-Host "Request ${i}: OK ($($r.StatusCode))" -ForegroundColor Gray }
}
