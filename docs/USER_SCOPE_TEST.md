# 사용자 스코프 자동 검증

웹 서버(`apps/web`)를 실행한 상태에서 아래 스크립트로 A/B 사용자 분리 동작을 확인할 수 있습니다.

## 실행
```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify_user_scope.ps1 `
  -BaseUrl "http://localhost:3000" `
  -UserA "11111111-1111-4111-8111-111111111111" `
  -UserB "22222222-2222-4222-8222-222222222222"
```

## API 토큰 사용 중인 경우
```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify_user_scope.ps1 `
  -BaseUrl "http://localhost:3000" `
  -ApiToken "your_token" `
  -UserA "11111111-1111-4111-8111-111111111111" `
  -UserB "22222222-2222-4222-8222-222222222222"
```

## 성공 조건
- 사용자 A 조회에서는 방금 생성한 `scope-test-*` 항목이 보여야 함
- 사용자 B 조회에서는 해당 항목이 보이면 안 됨
