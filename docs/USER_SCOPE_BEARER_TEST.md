# 사용자 스코프 Bearer 검증

`Authorization: Bearer <supabase access token>`만으로 사용자 분리가 되는지 검증합니다.

## 실행
```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify_user_scope_bearer.ps1 `
  -BaseUrl "http://localhost:3000" `
  -UserAToken "<user-a-access-token>" `
  -UserBToken "<user-b-access-token>"
```

## API 토큰 사용 중인 경우
```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify_user_scope_bearer.ps1 `
  -BaseUrl "http://localhost:3000" `
  -ApiToken "your_notice_api_token" `
  -UserAToken "<user-a-access-token>" `
  -UserBToken "<user-b-access-token>"
```

## 성공 조건
- User A 토큰 조회에는 방금 생성한 `scope-bearer-test-*` 항목이 보입니다.
- User B 토큰 조회에는 해당 항목이 보이지 않아야 합니다.
