# Mobile App (Flutter)

## Goal
- iOS Share Extension로 URL 수집
- 링크 저장/분류
- 태스크/위젯 표시

## Bootstrap
```bash
flutter create .
```

생성 후 `lib/features/share_extension`부터 구현을 시작한다.

## Runtime config
- `NOTICE_API_BASE_URL`: 수집 API 서버 주소 (`default: http://127.0.0.1:3000`)
- `NOTICE_API_TOKEN`: API 보호 토큰 사용 시 전달
