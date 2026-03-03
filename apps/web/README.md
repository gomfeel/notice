# 웹 대시보드 (Next.js)

## 목표
- 링크/폴더/할 일 관리
- Supabase Realtime으로 모바일 저장 내용을 즉시 반영

## 실행
```bash
npm install
npm run dev
```

## 환경 변수
`.env.example`를 `.env.local`로 복사한 뒤 값을 설정하세요.

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` (선택)
- `NOTICE_API_TOKEN` (선택, API 보호)

`NOTICE_API_TOKEN` 설정 시:
- 같은 오리진 브라우저 요청은 허용
- 외부 요청은 `x-notice-api-token` 헤더가 일치해야 허용

Supabase 환경 변수가 없으면 수집 이력은 메모리 대체 모드로 동작합니다.