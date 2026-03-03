# Project Master Plan: Notice

## 1. 개요 (Overview)
- 서비스명: Notice (노티스)
- 한 줄 정의: 읽고 끝나는 링크를 모아 AI로 분류하고, 할 일까지 연결해 관리하는 개인 생산성 도구
- 해결하려는 문제:
  - 모바일에서 본 링크를 나중에 찾기 어렵다.
  - 저장은 했지만 분류가 안 되어 다시 보지 않는다.
  - 잠금화면/대시보드에서 바로 확인 가능한 실행 단위(할 일)로 연결이 필요하다.

## 2. 디자인 원칙 (Design Principles)
- Minimalist & Utility: 장식보다 정보 접근성과 처리 속도 우선
- Text-Centric: 제목/요약/분류/상태 중심 UI
- Efficiency: 최소 클릭으로 수집 → 분류 → 확인/완료까지 연결

## 3. 기술 스택 (Tech Stack)
- Mobile: Flutter (iOS Share Extension 연동)
- Web: Next.js (대시보드/관리)
- Backend/DB: Supabase (Postgres, RLS, Edge Functions)
- AI: OpenAI `gpt-4o-mini` (폴더 추천/기본 분류)

## 4. 로드맵 (Priority Roadmap)

### Phase 1 (현재 진행)
- iOS Share Extension으로 URL 전달
- 메타데이터 추출
- AI 기반 폴더 추천
- Supabase 저장 및 웹 대시보드 반영
- 할 일 생성/완료/잠금화면 표시 상태 관리

### Phase 2
- 잠금화면 위젯(할 일 표시)
- 잠금화면에서 즉시 완료 처리(인터랙션)

### Phase 3
- Google Calendar 양방향 동기화

## 5. 데이터 스키마 (Data Schema)
- users: `id`, `email`, `google_access_token`, `created_at`
- folders: `id`, `user_id`, `name`, `icon`, `created_at`
- links: `id`, `user_id`, `folder_id`, `original_url`, `title`, `summary`, `status`, `created_at`
- tasks: `id`, `user_id`, `content`, `is_completed`, `show_on_lock_screen`, `starts_at`, `ends_at`, `created_at`

## 6. 비기능 요구사항 (Non-functional)
- 다중 사용자 데이터 분리(RLS)
- 한국어 UI 우선
- 장애 시 메모리 폴백 경로 제공(개발 단계)
- API 보호 토큰(`NOTICE_API_TOKEN`) 지원

## 7. 현재 우선 과제 (2026-03-03 기준)
1. iOS Share Extension Xcode 실연결 완료
2. Supabase 마이그레이션 실제 적용 및 A/B 사용자 분리 검증
3. 인증 체계를 `auth.uid()` 중심으로 전환
4. 운영 로그/모니터링 도입
