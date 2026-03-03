# iOS Share Extension 구현 가이드

## 목표
- iOS 공유 시트에서 URL을 Notice 앱으로 전달
- App Group(UserDefaults)로 URL 공유
- Flutter 앱에서 MethodChannel로 공유 URL 읽기

## 포함된 파일
- `apps/mobile/ios/ShareExtension/ShareViewController.swift`
- `apps/mobile/ios/ShareExtension/Info.plist.template`
- `apps/mobile/ios/Runner/AppDelegate.template.swift`
- `apps/mobile/lib/features/share_extension/infrastructure/shared_url_channel.dart`
- `scripts/setup_ios_share_extension.ps1` (템플릿 적용 보조)
- `scripts/verify_ios_share_extension_setup.ps1` (설정 검증)

## 적용 순서
1. Flutter iOS 프로젝트 생성
2. Runner/ShareExtension 타깃 구성
3. Runner와 ShareExtension에 동일 App Group 추가
  - 예: `group.com.gomfeel.notice`
4. Runner URL Scheme 추가
  - 예: `notice://`
5. 템플릿 코드 반영
  - Runner `AppDelegate.swift`
  - ShareExtension `Info.plist`
6. Xcode에서 빌드/실기기 테스트

## 자동 적용 보조 스크립트
프로젝트 루트에서:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup_ios_share_extension.ps1
```

이 스크립트는 템플릿 파일을 아래 위치로 복사합니다.
- `apps/mobile/ios/Runner/AppDelegate.swift`
- `apps/mobile/ios/ShareExtension/Info.plist`

설정 검증:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify_ios_share_extension_setup.ps1
```

## MethodChannel 메서드
- `getSharedUrl`: App Group UserDefaults의 `shared_url` 반환
- `clearSharedUrl`: 전송 완료 후 `shared_url` 삭제

## 현재 상태
- Flutter/Dart 측 URL 수신 채널 구현 완료
- iOS 템플릿 코드 작성 완료
- Xcode 타깃 연결 및 서명/권한 설정은 수동 작업 필요
