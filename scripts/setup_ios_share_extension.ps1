param(
  [string]$IosRoot = "apps/mobile/ios",
  [switch]$Force
)

$ErrorActionPreference = "Stop"

$runnerTemplate = Join-Path $IosRoot "Runner/AppDelegate.template.swift"
$runnerTarget = Join-Path $IosRoot "Runner/AppDelegate.swift"
$sharePlistTemplate = Join-Path $IosRoot "ShareExtension/Info.plist.template"
$sharePlistTarget = Join-Path $IosRoot "ShareExtension/Info.plist"

if (-not (Test-Path $runnerTemplate)) {
  Write-Error "템플릿 파일이 없습니다: $runnerTemplate"
  exit 1
}

if (-not (Test-Path $sharePlistTemplate)) {
  Write-Error "템플릿 파일이 없습니다: $sharePlistTemplate"
  exit 1
}

function Copy-Template {
  param(
    [string]$Source,
    [string]$Target,
    [switch]$AllowOverwrite
  )

  if ((Test-Path $Target) -and -not $AllowOverwrite) {
    Write-Host "건너뜀(이미 존재): $Target"
    return
  }

  Copy-Item -Path $Source -Destination $Target -Force
  Write-Host "적용 완료: $Target"
}

Copy-Template -Source $runnerTemplate -Target $runnerTarget -AllowOverwrite:$Force
Copy-Template -Source $sharePlistTemplate -Target $sharePlistTarget -AllowOverwrite:$Force

Write-Host ""
Write-Host "다음 수동 작업:"
Write-Host "1) Xcode에서 Runner/ShareExtension 타깃 열기"
Write-Host "2) App Group 동일 설정 (예: group.com.gomfeel.notice)"
Write-Host "3) Runner URL Scheme 설정 (예: notice://)"
Write-Host "4) ShareExtension의 Principal class가 ShareViewController인지 확인"
