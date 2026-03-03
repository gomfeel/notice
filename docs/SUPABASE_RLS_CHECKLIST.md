# Supabase RLS 적용 체크리스트

## 대상 마이그레이션
- `supabase/migrations/0001_init.sql`
- `supabase/migrations/0002_rls.sql`
- `supabase/migrations/0003_user_scope.sql`

## 0003의 핵심 변경
- `links.user_id` 컬럼 추가 및 기존 데이터 백필
- `notice_request_user_id()` 함수 추가
  - 우선순위: `auth.uid()` -> `x-notice-user-id` 헤더
- `users/folders/links/tasks` 정책을 사용자 스코프 기준으로 재생성

## 애플리케이션 설정
- 웹 서버:
  - `NOTICE_REQUIRE_USER_ID=1` (권장)
  - `NOTICE_DEFAULT_USER_ID` (선택)
- 웹 클라이언트:
  - 대시보드에서 사용자 ID 저장 (`localStorage.notice_user_id`)
- 모바일:
  - `--dart-define=NOTICE_USER_ID=<uuid>`

## 검증 시나리오
1. 사용자 A UUID로 링크/태스크 생성
2. 사용자 B UUID로 동일 API 조회
3. A 데이터가 B에게 보이지 않아야 함
4. A의 row를 B UUID로 수정 시 0 row 또는 권한 오류가 나와야 함
