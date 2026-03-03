param(
  [string]$IosRoot = "apps/mobile/ios",
  [string]$ExpectedAppGroup = "group.com.gomfeel.notice",
  [string]$ExpectedUrlScheme = "notice"
)

$ErrorActionPreference = "Stop"
$failed = $false

function Pass($msg) { Write-Host "[PASS] $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Fail($msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red; $script:failed = $true }

function MustExist([string]$path, [string]$label) {
  if (Test-Path $path) {
    Pass "$label 존재: $path"
    return $true
  }
  Fail "$label 없음: $path"
  return $false
}

$runnerAppDelegate = Join-Path $IosRoot "Runner/AppDelegate.swift"
$shareController = Join-Path $IosRoot "ShareExtension/ShareViewController.swift"
$shareInfo = Join-Path $IosRoot "ShareExtension/Info.plist"
$runnerInfo = Join-Path $IosRoot "Runner/Info.plist"
$runnerEntitlements = Join-Path $IosRoot "Runner/Runner.entitlements"
$shareEntitlements = Join-Path $IosRoot "ShareExtension/ShareExtension.entitlements"
$runnerXcodeProj = Join-Path $IosRoot "Runner.xcodeproj"
$runnerXcworkspace = Join-Path $IosRoot "Runner.xcworkspace"

$hasIosProject = (Test-Path $runnerXcodeProj) -or (Test-Path $runnerXcworkspace)
if ($hasIosProject) {
  Pass "iOS 프로젝트 파일 확인"
} else {
  Warn "Runner.xcodeproj/xcworkspace가 없습니다. 아직 flutter create 이전 상태일 수 있습니다."
}

$okRunner = MustExist $runnerAppDelegate "Runner AppDelegate"
$okShareController = MustExist $shareController "ShareViewController"
$okShareInfo = MustExist $shareInfo "ShareExtension Info.plist"
$okRunnerInfo = $true
if ($hasIosProject) {
  $okRunnerInfo = MustExist $runnerInfo "Runner Info.plist"
} else {
  if (Test-Path $runnerInfo) {
    Pass "Runner Info.plist 존재"
  } else {
    Warn "Runner Info.plist가 없습니다(프로젝트 초기화 후 자동 생성됨)."
    $okRunnerInfo = $false
  }
}

if ($okRunner) {
  $appDelegate = Get-Content -Raw $runnerAppDelegate
  if ($appDelegate -match "notice/share_extension") {
    Pass "AppDelegate MethodChannel 설정 확인"
  } else {
    Fail "AppDelegate에 MethodChannel(notice/share_extension) 설정이 없습니다."
  }
}

if ($okShareController) {
  $shareCode = Get-Content -Raw $shareController
  if ($shareCode -match [regex]::Escape($ExpectedAppGroup)) {
    Pass "ShareViewController App Group 설정 확인 ($ExpectedAppGroup)"
  } else {
    Warn "ShareViewController App Group 문자열이 예상값과 다릅니다. 예상: $ExpectedAppGroup"
  }
}

if ($okRunnerInfo) {
  $runnerInfoXml = Get-Content -Raw $runnerInfo
  if ($runnerInfoXml -match "<key>CFBundleURLTypes</key>" -and $runnerInfoXml -match [regex]::Escape($ExpectedUrlScheme)) {
    Pass "Runner URL Scheme 설정 확인 ($ExpectedUrlScheme)"
  } else {
    Warn "Runner Info.plist에서 URL Scheme($ExpectedUrlScheme) 확인 실패"
  }
}

if (Test-Path $runnerEntitlements) {
  $runnerEnt = Get-Content -Raw $runnerEntitlements
  if ($runnerEnt -match [regex]::Escape($ExpectedAppGroup)) {
    Pass "Runner entitlements App Group 확인"
  } else {
    Warn "Runner entitlements에 App Group($ExpectedAppGroup)이 없습니다."
  }
} else {
  Warn "Runner.entitlements 파일이 없습니다. Xcode에서 App Group 설정이 필요합니다."
}

if (Test-Path $shareEntitlements) {
  $shareEnt = Get-Content -Raw $shareEntitlements
  if ($shareEnt -match [regex]::Escape($ExpectedAppGroup)) {
    Pass "ShareExtension entitlements App Group 확인"
  } else {
    Warn "ShareExtension entitlements에 App Group($ExpectedAppGroup)이 없습니다."
  }
} else {
  Warn "ShareExtension.entitlements 파일이 없습니다. Xcode에서 App Group 설정이 필요합니다."
}

if ($failed) {
  Write-Host ""
  Write-Host "검증 실패 항목이 있습니다. 위 FAIL 항목을 먼저 수정하세요." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "치명적 오류는 없습니다. WARN 항목은 Xcode에서 추가 설정 여부를 확인하세요." -ForegroundColor Green
