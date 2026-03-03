param(
  [string]$IosRoot = "apps/mobile/ios",
  [string]$AppGroup = "group.com.gomfeel.notice",
  [string]$UrlScheme = "notice",
  [switch]$Force
)

$ErrorActionPreference = "Stop"

$runnerTemplate = Join-Path $IosRoot "Runner/AppDelegate.template.swift"
$runnerTarget = Join-Path $IosRoot "Runner/AppDelegate.swift"
$sharePlistTemplate = Join-Path $IosRoot "ShareExtension/Info.plist.template"
$sharePlistTarget = Join-Path $IosRoot "ShareExtension/Info.plist"
$runnerEntTemplate = Join-Path $IosRoot "Runner/Runner.entitlements.template"
$runnerEntTarget = Join-Path $IosRoot "Runner/Runner.entitlements"
$shareEntTemplate = Join-Path $IosRoot "ShareExtension/ShareExtension.entitlements.template"
$shareEntTarget = Join-Path $IosRoot "ShareExtension/ShareExtension.entitlements"
$runnerInfo = Join-Path $IosRoot "Runner/Info.plist"

function Fail([string]$msg) {
  Write-Host "[FAIL] $msg" -ForegroundColor Red
  exit 1
}

function Copy-Template {
  param(
    [string]$Source,
    [string]$Target,
    [switch]$AllowOverwrite
  )

  if (-not (Test-Path $Source)) {
    Fail "Template not found: $Source"
  }

  if ((Test-Path $Target) -and -not $AllowOverwrite) {
    Write-Host "[SKIP] Already exists: $Target"
    return
  }

  Copy-Item -Path $Source -Destination $Target -Force
  Write-Host "[OK] Applied: $Target"
}

function Apply-TokenReplace {
  param(
    [string]$Path,
    [string]$Token,
    [string]$Value
  )

  if (-not (Test-Path $Path)) { return }
  $text = Get-Content -Raw $Path
  $updated = $text.Replace($Token, $Value)
  if ($updated -ne $text) {
    Set-Content -Path $Path -Value $updated -NoNewline
    Write-Host "[OK] Replaced token in: $Path"
  }
}

function Ensure-RunnerUrlScheme {
  param(
    [string]$InfoPlistPath,
    [string]$Scheme
  )

  if (-not (Test-Path $InfoPlistPath)) {
    Write-Host "[WARN] Runner Info.plist not found (create Flutter iOS project first): $InfoPlistPath" -ForegroundColor Yellow
    return
  }

  $xml = Get-Content -Raw $InfoPlistPath
  if ($xml -match "<string>$([regex]::Escape($Scheme))</string>") {
    Write-Host "[OK] URL scheme already exists in Runner Info.plist: $Scheme"
    return
  }

  $insert = @"
	<key>CFBundleURLTypes</key>
	<array>
		<dict>
			<key>CFBundleURLName</key>
			<string>notice.share</string>
			<key>CFBundleURLSchemes</key>
			<array>
				<string>$Scheme</string>
			</array>
		</dict>
	</array>
"@

  if ($xml -match "</dict>\s*</plist>\s*$") {
    $updated = [regex]::Replace($xml, "</dict>\s*</plist>\s*$", "$insert`r`n</dict>`r`n</plist>")
    Set-Content -Path $InfoPlistPath -Value $updated -NoNewline
    Write-Host "[OK] Added URL scheme to Runner Info.plist: $Scheme"
  } else {
    Write-Host "[WARN] Could not patch Runner Info.plist automatically. Add URL scheme manually: $Scheme" -ForegroundColor Yellow
  }
}

Copy-Template -Source $runnerTemplate -Target $runnerTarget -AllowOverwrite:$Force
Copy-Template -Source $sharePlistTemplate -Target $sharePlistTarget -AllowOverwrite:$Force
Copy-Template -Source $runnerEntTemplate -Target $runnerEntTarget -AllowOverwrite:$Force
Copy-Template -Source $shareEntTemplate -Target $shareEntTarget -AllowOverwrite:$Force

Apply-TokenReplace -Path $runnerEntTarget -Token "__APP_GROUP__" -Value $AppGroup
Apply-TokenReplace -Path $shareEntTarget -Token "__APP_GROUP__" -Value $AppGroup
Ensure-RunnerUrlScheme -InfoPlistPath $runnerInfo -Scheme $UrlScheme

Write-Host ""
Write-Host "Next manual checks in Xcode:"
Write-Host "1) Confirm Runner and ShareExtension targets include entitlements files"
Write-Host "2) Confirm both targets use same App Group: $AppGroup"
Write-Host "3) Confirm URL scheme in Runner: ${UrlScheme}://"
Write-Host "4) Confirm ShareExtension principal class is ShareViewController"
