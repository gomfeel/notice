# Web Dashboard (Next.js)

## Goal
- 링크/폴더/태스크 관리
- Supabase Realtime으로 모바일 저장 내용 즉시 반영

## Run
```bash
npm install
npm run dev
```

## Env
Copy `.env.example` to `.env.local` and set values.

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` (optional for next step)

Without Supabase env, intake history uses in-memory fallback.