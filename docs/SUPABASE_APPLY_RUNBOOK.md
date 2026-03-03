# Supabase 적용 런북

## 목적
로컬 저장소의 마이그레이션(`supabase/migrations`)을 Supabase 프로젝트에 적용하고
사용자 분리(RLS) 동작을 빠르게 검증한다.

## 사전 준비
1. Supabase CLI 설치
2. 프로젝트 루트에서 로그인
```bash
supabase login
```
3. 프로젝트 연결
```bash
supabase link --project-ref <your-project-ref>
```

## 마이그레이션 적용
아래 순서대로 적용된다.
- `0001_init.sql`
- `0002_rls.sql`
- `0003_user_scope.sql`

```bash
supabase db push
```

## 적용 후 확인 SQL
```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'links'
order by ordinal_position;
```

`links.user_id`가 존재해야 한다.

## 사용자 분리 검증
1. 대시보드에서 사용자 ID(A UUID) 저장
2. 링크/할 일/폴더 생성
3. 사용자 ID(B UUID)로 변경
4. A 데이터가 보이지 않는지 확인

## 주의사항
- 사용자 ID는 UUID 형식이어야 한다.
- `NOTICE_REQUIRE_USER_ID=1`이면 헤더 없는 요청은 거절된다.
- 모바일은 `--dart-define=NOTICE_USER_ID=<uuid>` 전달이 필요하다.
