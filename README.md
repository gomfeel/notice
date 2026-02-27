# notice project

PRD 기반 초기 모노레포 구조입니다.

## Structure
- apps/mobile: Flutter 앱 (iOS Share Extension, Widget 대응)
- apps/web: Next.js 대시보드
- supabase: DB 마이그레이션 + Edge Function
- src: 공통 로직 초안 (AI/메타데이터/연동)
- docs: 설계 문서
- prompts: OpenAI 프롬프트 템플릿

## Next Steps
1. Flutter 프로젝트 생성: `apps/mobile`에서 `flutter create .`
2. Next.js 프로젝트 생성: `apps/web`에서 `npx create-next-app@latest .`
3. Supabase 프로젝트 연결 후 `supabase/migrations/0001_init.sql` 적용
4. iOS Share Extension -> URL 수신 -> AI 폴더 추천 플로우 구현
