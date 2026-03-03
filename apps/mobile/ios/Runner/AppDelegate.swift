import UIKit
import Flutter

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
    private let appGroupId = "group.com.gomfeel.notice"
    private let sharedUrlKey = "shared_url"
    private let channelName = "notice/share_extension"

    override func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        let controller = window?.rootViewController as? FlutterViewController
        let channel = FlutterMethodChannel(name: channelName, binaryMessenger: controller!.binaryMessenger)

        channel.setMethodCallHandler { [weak self] call, result in
            guard let self else {
                result(FlutterError(code: "NO_APP", message: "AppDelegate not available", details: nil))
                return
            }

            switch call.method {
            case "getSharedUrl":
                let defaults = UserDefaults(suiteName: self.appGroupId)
                let url = defaults?.string(forKey: self.sharedUrlKey)
                result(url)
            case "clearSharedUrl":
                let defaults = UserDefaults(suiteName: self.appGroupId)
                defaults?.removeObject(forKey: self.sharedUrlKey)
                result(nil)
            default:
                result(FlutterMethodNotImplemented)
            }
        }

        return super.application(application, didFinishLaunchingWithOptions: launchOptions)
    }
}