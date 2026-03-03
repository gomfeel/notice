# 웹 대시보드 (Next.js)

## 목표
- 링크/폴더/할 일을 웹에서 관리
- 모바일에서 수집한 URL을 대시보드에서 확인

## 실행
```bash
npm install
npm run dev
```

## 환경 변수
`.env.example`를 `.env.local`로 복사해 값을 설정합니다.

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` (선택)
- `NOTICE_API_TOKEN` (선택, 쓰기 API 보호)
- `NOTICE_REQUIRE_USER_ID` (선택, `1`이면 사용자 ID 헤더 필수)
- `NOTICE_DEFAULT_USER_ID` (선택, 헤더가 없을 때 기본 사용자 ID)

## API 보호 정책
- `NOTICE_API_TOKEN`이 비어 있으면 토큰 검증을 건너뜁니다.
- 값이 설정되면 외부 요청은 `x-notice-api-token` 헤더가 일치해야 허용됩니다.
- 동일 오리진 브라우저 요청은 허용됩니다.

## 사용자 스코프 정책
- API는 `x-notice-user-id` 헤더를 읽어 Supabase `user_id` 기준으로 조회/수정합니다.
- `NOTICE_REQUIRE_USER_ID=1`이면 사용자 ID가 없는 요청은 거절됩니다.
- 웹 내부 호출만 쓰는 경우 `NOTICE_DEFAULT_USER_ID`를 설정해 기본 사용자로 동작시킬 수 있습니다.

## 참고
- Supabase 환경 변수가 없으면 메모리 폴백 경로로 동작합니다.
