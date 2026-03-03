# Phase 1 Status

## Implemented
- URL 수집 API: `POST /api/intake`
- 수집 이력 API: `GET /api/intake`
- 링크 상태 변경 API: `PATCH /api/intake/:id`
- 폴더 API: `GET /api/folders`, `POST /api/folders`
- 할 일 API: `GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/:id`
- 대시보드 URL 수집 폼 + 최근 항목 목록
- 대시보드 링크 상태 토글(확인 전/확인 완료)
- 대시보드 링크 필터/정렬/검색(쿼리 동기화)
- 대시보드 폴더 목록 + 폴더 추가
- 대시보드 할 일 목록 + 완료 체크 + 할 일 추가
- 대시보드 할 일 필터/검색
- 할 일 시작/종료 시간 입력/저장/표시
- 메타데이터 추출 헬퍼
- 분류 경로:
  - Supabase Edge Function(OpenAI `gpt-4o-mini`)
  - OpenAI 키 미설정/실패 시 키워드 대체
- Supabase 저장 경로:
  - 환경 변수 설정 시 실제 저장
  - 미설정 시 메모리 대체
- API 최소 보호 레이어:
  - `NOTICE_API_TOKEN` 설정 시 외부 요청 토큰 검사
  - 동일 오리진 브라우저 요청은 허용
- 모바일 Share Extension 착수:
  - iOS ShareViewController 템플릿 추가
  - Flutter MethodChannel 수신 코드 추가
  - Runner AppDelegate MethodChannel 템플릿 추가

## Remaining for production
- iOS Share Extension Xcode 타깃 실제 연결 및 App Group 설정
- iOS Runner AppDelegate 템플릿 실제 반영/빌드 검증
- 실제 사용자 인증 세션 기반 RLS 검증
- 재시도 큐 및 관측성(로그/알림)
- 프롬프트 버전 관리 체계