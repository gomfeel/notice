# iOS Share Extension 구현 가이드

## 목표
- iOS 공유 시트에서 URL을 Notice 앱으로 전달
- App Group(UserDefaults) 경유로 URL 저장
- Flutter 앱에서 MethodChannel로 URL 읽기

## 포함된 파일
- `apps/mobile/ios/ShareExtension/ShareViewController.swift`
- `apps/mobile/ios/ShareExtension/Info.plist.template`
- `apps/mobile/ios/Runner/AppDelegate.template.swift`
- `apps/mobile/lib/features/share_extension/infrastructure/shared_url_channel.dart`

## iOS 설정 순서
1. Flutter iOS 프로젝트 생성 후 Runner/ShareExtension 타깃 생성
2. Runner와 ShareExtension 모두 동일 App Group 추가
  - 예: `group.com.gomfeel.notice`
3. Runner URL Scheme 추가
  - 예: `notice://`
4. ShareExtension의 메인 클래스에 `ShareViewController` 연결
5. Runner의 `AppDelegate.swift`에 MethodChannel 등록
  - 템플릿: `apps/mobile/ios/Runner/AppDelegate.template.swift`
  - 채널명: `notice/share_extension`
  - 메서드: `getSharedUrl`, `clearSharedUrl`

## MethodChannel 구현 포인트
- `getSharedUrl`: App Group UserDefaults의 `shared_url` 반환
- `clearSharedUrl`: 전송 완료 후 `shared_url` 제거

## 현재 상태
- Flutter/Dart 레이어: URL 수신 채널 호출 코드 반영 완료
- iOS 네이티브: ShareExtension/Runner 템플릿 코드 추가 완료
- Xcode 타깃 연결 및 권한 설정: 수동 작업 필요