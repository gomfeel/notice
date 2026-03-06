# Supabase Quick Apply (Windows)

실환경 반영을 한 번에 실행합니다.

## 1) DB 마이그레이션 적용
```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply_supabase_remote.ps1 `
  -ProjectRef "<your-project-ref>" `
  -AccessToken "<your-supabase-access-token>"
```

## 2) Edge Function까지 같이 배포
```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply_supabase_remote.ps1 `
  -ProjectRef "<your-project-ref>" `
  -AccessToken "<your-supabase-access-token>" `
  -DeployAiFunction `
  -OpenAiApiKey "<openai-api-key>" `
  -SupabaseUrl "https://<your-project-ref>.supabase.co" `
  -SupabaseAnonKey "<supabase-anon-key>"
```

## 3) 적용 후 검증
- 대시보드에서 `/api/health` 확인
- `scripts/verify_user_scope.ps1` 또는 `scripts/verify_user_scope_bearer.ps1` 실행
- Supabase SQL Editor에서 `links.user_id` 컬럼 존재 확인
