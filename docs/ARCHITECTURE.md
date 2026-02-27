# Notice Architecture (Initial)

## Product Goal
모바일에서 수집한 링크/메모를 AI로 자동 분류하고, PC 대시보드에서 즉시 정리한다.

## System Components
- Mobile (Flutter): URL 공유 수신, 링크 저장, 태스크/위젯 표시
- Web (Next.js): 폴더/링크/태스크 관리 대시보드
- Backend (Supabase): Auth, Postgres, Realtime, Edge Functions
- AI (OpenAI): 링크 메타데이터 요약 및 폴더 추천

## Core Flow (Phase 1)
1. iOS Share Extension에서 URL 전달
2. Mobile 앱이 URL 메타데이터 수집
3. AI가 기존 폴더 목록 기준으로 추천 폴더 반환
4. `links` 테이블 저장 및 Realtime 반영
5. Web 대시보드에서 즉시 조회
