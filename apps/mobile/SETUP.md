# Mobile Setup

현재 환경에서 `flutter` CLI가 설치되어 있지 않아 자동 초기화는 진행되지 않았습니다.

## Required
1. Flutter SDK 설치
2. PATH에 `flutter` 등록
3. 아래 명령 실행

```bash
cd apps/mobile
flutter create .
flutter pub get
flutter run --dart-define=NOTICE_API_BASE_URL=http://127.0.0.1:3000
```

## Optional (API token enabled server)

서버에서 `NOTICE_API_TOKEN`을 설정했다면 모바일 실행 시 같은 값을 전달해야 합니다.

```bash
flutter run --dart-define=NOTICE_API_BASE_URL=http://127.0.0.1:3000 --dart-define=NOTICE_API_TOKEN=your_token
```

## Device networking note

- iOS 시뮬레이터: `http://127.0.0.1:3000` 사용 가능
- 실제 기기: 개발 PC의 로컬 IP 사용 (예: `http://192.168.0.10:3000`)
