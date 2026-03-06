# Windows iOS Progress Guide

Windows에서는 Xcode를 실행할 수 없기 때문에, iOS 빌드 검증은 GitHub Actions(macOS runner)로 진행합니다.

## 1) 로컬(Windows) 개발
- Flutter/Dart 코드 수정
- iOS Share Extension 템플릿/설정 파일 유지
- 필요 시 로컬 검증:
  - `powershell -ExecutionPolicy Bypass -File scripts/verify_ios_share_extension_setup.ps1 -ExpectedUrlScheme notice`

## 2) 원격 iOS 빌드 실행
1. 변경사항 커밋/푸시
2. GitHub 저장소 `Actions` 탭에서 `iOS CI` 확인
3. 실패 시 로그 기준으로 코드 수정 후 재푸시

## 3) 가능한 것 / 불가능한 것
- 가능한 것(Windows): 코드 작성, 정적분석/테스트, iOS 원격 컴파일 검증
- 불가능한 것(Windows 단독): Xcode 서명, Provisioning Profile 적용, 실기기 iOS 설치/실행

## 4) 배포 직전 최소 수동 작업(Mac 필요)
- Runner/ShareExtension 서명 설정
- App Group / Entitlements 최종 확인
- Archive 및 TestFlight 업로드
