import UIKit
import Social
import UniformTypeIdentifiers

final class ShareViewController: SLComposeServiceViewController {
    private let appGroupId = "group.com.gomfeel.notice"
    private let sharedUrlKey = "shared_url"
    private let hostUrlScheme = "notice://share"

    override func isContentValid() -> Bool {
        return true
    }

    override func didSelectPost() {
        guard let item = extensionContext?.inputItems.first as? NSExtensionItem,
              let provider = item.attachments?.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.url.identifier) }) else {
            completeRequest()
            return
        }

        provider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { [weak self] value, _ in
            guard let self,
                  let sharedUrl = value as? URL else {
                self?.completeRequest()
                return
            }

            let defaults = UserDefaults(suiteName: self.appGroupId)
            defaults?.set(sharedUrl.absoluteString, forKey: self.sharedUrlKey)

            if let encoded = sharedUrl.absoluteString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
               let url = URL(string: "\(self.hostUrlScheme)?url=\(encoded)") {
                self.openHostApp(url: url)
            }

            self.completeRequest()
        }
    }

    override func configurationItems() -> [Any]! {
        return []
    }

    private func openHostApp(url: URL) {
        var responder: UIResponder? = self
        while responder != nil {
            if let application = responder as? UIApplication {
                application.open(url, options: [:], completionHandler: nil)
                break
            }
            responder = responder?.next
        }
    }

    private func completeRequest() {
        extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
}