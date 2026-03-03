param(
  [string]$BaseUrl = "http://localhost:3000",
  [string]$ApiToken = "",
  [Parameter(Mandatory = $true)][string]$UserA,
  [Parameter(Mandatory = $true)][string]$UserB
)

$ErrorActionPreference = "Stop"

function Invoke-NoticeApi {
  param(
    [ValidateSet("GET", "POST", "PATCH")][string]$Method,
    [string]$Path,
    [string]$UserId,
    [hashtable]$Body = @{}
  )

  $headers = @{
    "x-notice-user-id" = $UserId
  }

  if ($ApiToken -and $ApiToken.Trim().Length -gt 0) {
    $headers["x-notice-api-token"] = $ApiToken.Trim()
  }

  $uri = "$BaseUrl$Path"
  if ($Method -eq "GET") {
    return Invoke-RestMethod -Method GET -Uri $uri -Headers $headers
  }

  return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 10)
}

Write-Host "[1/4] 사용자 A로 테스트 할 일 생성"
$marker = "scope-test-" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$null = Invoke-NoticeApi -Method POST -Path "/api/tasks" -UserId $UserA -Body @{
  content = $marker
  showOnLockScreen = $false
}

Write-Host "[2/4] 사용자 A 할 일 조회"
$aTasks = Invoke-NoticeApi -Method GET -Path "/api/tasks" -UserId $UserA
$aHasMarker = @($aTasks.items | Where-Object { $_.content -eq $marker }).Count -gt 0

Write-Host "[3/4] 사용자 B 할 일 조회"
$bTasks = Invoke-NoticeApi -Method GET -Path "/api/tasks" -UserId $UserB
$bHasMarker = @($bTasks.items | Where-Object { $_.content -eq $marker }).Count -gt 0

Write-Host "[4/4] 결과 판정"
if (-not $aHasMarker) {
  Write-Error "실패: 사용자 A 조회에서 생성한 항목을 찾지 못했습니다."
  exit 1
}

if ($bHasMarker) {
  Write-Error "실패: 사용자 B 조회에서 사용자 A 항목이 노출되었습니다."
  exit 1
}

Write-Host "성공: 사용자 스코프 분리가 정상 동작합니다."
Write-Host "테스트 키: $marker"
