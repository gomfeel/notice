param(
  [Parameter(Mandatory = $true)][string]$ProjectRef,
  [Parameter(Mandatory = $true)][string]$AccessToken,
  [string]$OpenAiApiKey = "",
  [string]$SupabaseUrl = "",
  [string]$SupabaseAnonKey = "",
  [switch]$DeployAiFunction
)

$ErrorActionPreference = "Stop"

function Invoke-Step([string]$title, [scriptblock]$action) {
  Write-Host ""
  Write-Host "==> $title" -ForegroundColor Cyan
  & $action
}

function Ensure-Success([int]$code, [string]$message) {
  if ($code -ne 0) {
    throw $message
  }
}

$env:SUPABASE_ACCESS_TOKEN = $AccessToken

Invoke-Step "Link project ($ProjectRef)" {
  npx supabase@latest link --project-ref $ProjectRef
  Ensure-Success $LASTEXITCODE "supabase link failed."
}

Invoke-Step "Apply migrations (db push)" {
  npx supabase@latest db push
  Ensure-Success $LASTEXITCODE "supabase db push failed."
}

if ($DeployAiFunction) {
  if (-not $OpenAiApiKey.Trim()) {
    throw "DeployAiFunction 옵션 사용 시 OpenAiApiKey가 필요합니다."
  }

  if (-not $SupabaseUrl.Trim() -or -not $SupabaseAnonKey.Trim()) {
    throw "DeployAiFunction 옵션 사용 시 SupabaseUrl, SupabaseAnonKey가 필요합니다."
  }

  Invoke-Step "Set edge function secrets" {
    npx supabase@latest secrets set OPENAI_API_KEY=$OpenAiApiKey SUPABASE_URL=$SupabaseUrl SUPABASE_ANON_KEY=$SupabaseAnonKey
    Ensure-Success $LASTEXITCODE "supabase secrets set failed."
  }

  Invoke-Step "Deploy edge function: ai-categorize" {
    npx supabase@latest functions deploy ai-categorize --no-verify-jwt
    Ensure-Success $LASTEXITCODE "supabase functions deploy failed."
  }
}

Write-Host ""
Write-Host "Supabase apply completed." -ForegroundColor Green
