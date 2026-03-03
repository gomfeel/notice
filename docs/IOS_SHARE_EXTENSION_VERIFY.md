# iOS Share Extension 설정 검증

## 목적
Xcode 연동 후 필수 파일/설정이 누락되지 않았는지 빠르게 점검한다.

## 실행
```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify_ios_share_extension_setup.ps1
```

## 옵션
```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify_ios_share_extension_setup.ps1 `
  -ExpectedAppGroup "group.com.gomfeel.notice" `
  -ExpectedUrlScheme "notice"
```

## 점검 항목
- `Runner/AppDelegate.swift` 존재
- `ShareExtension/ShareViewController.swift` 존재
- `ShareExtension/Info.plist` 존재
- `Runner/Info.plist` 존재(프로젝트 생성 후)
- AppDelegate MethodChannel(`notice/share_extension`) 설정
- ShareViewController App Group 문자열
- Runner URL Scheme
- Runner/ShareExtension entitlements App Group

## 판정
- `FAIL`: 즉시 수정 필요
- `WARN`: Xcode 설정에서 추가 확인 필요

## 참고
- `flutter create` 이전에는 `Runner.xcodeproj`, `Runner/Info.plist`가 없어 WARN이 정상입니다.
