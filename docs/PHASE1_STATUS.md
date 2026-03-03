# Phase 1 Status (2026-03-03)

## 완료된 항목
- URL 수집 API
  - `POST /api/intake`
  - `GET /api/intake`
  - `PATCH /api/intake/:id` (확인 상태 변경)
- 폴더 API
  - `GET /api/folders`
  - `POST /api/folders`
  - Supabase 저장 경로 + memory fallback 연동
- 할 일 API
  - `GET /api/tasks`
  - `POST /api/tasks`
  - `PATCH /api/tasks/:id` (완료/잠금화면 표시 토글)
- 대시보드 기능
  - URL 수집 입력 + 최근 수집 목록
  - 링크 상태 토글(확인 전/완료)
  - 폴더 추가/목록
  - 할 일 추가/완료/잠금화면 표시
  - 필터/검색/정렬 + URL 쿼리 동기화
  - 자동 재조회(15초 주기)
  - 사용자 ID 설정 패널(localStorage `notice_user_id`)
- 모바일(기반)
  - Share Extension 템플릿(ios/ShareExtension)
  - iOS 템플릿 적용 스크립트(`scripts/setup_ios_share_extension.ps1`)
  - iOS 설정 검증 스크립트(`scripts/verify_ios_share_extension_setup.ps1`)
  - `AppDelegate.swift`, `ShareExtension/Info.plist` 생성 반영
  - `Runner/Runner.entitlements`, `ShareExtension/ShareExtension.entitlements` 생성 반영
  - MethodChannel 수신 코드
  - 모바일 intake API 호출 설정(`NOTICE_API_BASE_URL`, `NOTICE_API_TOKEN`, `NOTICE_USER_ID`)
- 보안/분리
  - `NOTICE_API_TOKEN` 기반 API 보호
  - `x-notice-user-id` 기반 사용자 스코프
  - 서버 UUID 검증
  - Supabase RLS 마이그레이션 `0003_user_scope.sql` 추가

## 문서/운영 보조
- RLS 체크리스트: `docs/SUPABASE_RLS_CHECKLIST.md`
- Supabase 적용 런북: `docs/SUPABASE_APPLY_RUNBOOK.md`
- 사용자 분리 자동 검증: `scripts/verify_user_scope.ps1`, `docs/USER_SCOPE_TEST.md`

## 운영 전 남은 항목
1. iOS Share Extension Xcode 실연결
   - Runner/App Group/URL Scheme/Entitlements 실제 반영
2. Supabase 실환경 적용 검증
   - `supabase db push`
   - A/B 사용자 분리 시나리오 실행 결과 확인
3. 인증 고도화
   - `x-notice-user-id` 보조 구조에서 `auth.uid()` 중심으로 전환
4. 관측성/운영
   - 에러 로깅, 요청 추적, 기본 모니터링
