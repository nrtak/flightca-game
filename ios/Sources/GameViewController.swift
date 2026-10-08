import UIKit
import WebKit

// The game and its assets are bundled; no network connection is needed to play.
final class GameViewController: UIViewController, WKScriptMessageHandler, WKNavigationDelegate {
    private var webView: WKWebView!
    private let keys = ["cabin-crew-career-v1", "cabin-crew-flight-v1"]
    private var gameDirectory: URL?

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.91, green: 0.95, blue: 0.97, alpha: 1)
        let controller = WKUserContentController()
        controller.add(self, name: "cabinSave")
        let snapshot = Dictionary(uniqueKeysWithValues: keys.compactMap { key -> (String, String)? in
            guard let value = UserDefaults.standard.string(forKey: key) else { return nil }
            return (key, value)
        })
        let data = (try? JSONSerialization.data(withJSONObject: snapshot, options: [.sortedKeys])) ?? Data("{}".utf8)
        let json = String(decoding: data, as: UTF8.self)
        let source = """
        (() => {
            const values = \(json);
            window.cabinNativeStorage = {
                getItem(key) { return Object.prototype.hasOwnProperty.call(values,key) ? values[key] : null; },
                setItem(key,value) {
                    value=String(value);
                    window.webkit.messageHandlers.cabinSave.postMessage({key,value});
                    values[key]=value;
                },
                removeItem(key) {
                    window.webkit.messageHandlers.cabinSave.postMessage({key,value:null});
                    delete values[key];
                }
            };
        })();
        """
        controller.addUserScript(WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        let config = WKWebViewConfiguration()
        config.userContentController = controller
        config.websiteDataStore = .default()
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = view.backgroundColor
        webView.scrollView.bounces = false
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        NotificationCenter.default.addObserver(self, selector: #selector(pauseGame), name: UIApplication.willResignActiveNotification, object: nil)
        guard let directory = Bundle.main.url(forResource: "Web", withExtension: nil),
              FileManager.default.fileExists(atPath: directory.appendingPathComponent("index.html").path) else {
            let label = UILabel()
            label.text = "The cabin could not load. Please reinstall this build."
            label.numberOfLines = 0
            label.textAlignment = .center
            label.frame = view.bounds.insetBy(dx: 24, dy: 24)
            label.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            view.addSubview(label)
            return
        }
        gameDirectory = directory
        webView.loadFileURL(directory.appendingPathComponent("index.html"), allowingReadAccessTo: directory)
    }

    @objc private func pauseGame() {
        webView?.evaluateJavaScript("if(typeof pauseFlight==='function')pauseFlight();", completionHandler: nil)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame,
              let url = message.frameInfo.request.url, url.isFileURL,
              let directory = gameDirectory,
              url.standardizedFileURL.path.hasPrefix(directory.standardizedFileURL.path + "/"),
              let body = message.body as? [String: Any],
              let key = body["key"] as? String, keys.contains(key) else { return }
        if body["value"] is NSNull {
            UserDefaults.standard.removeObject(forKey: key)
        } else if let value = body["value"] as? String, value.utf8.count <= 100_000 {
            UserDefaults.standard.set(value, forKey: key)
        }
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url, let directory = gameDirectory else {
            decisionHandler(.cancel); return
        }
        let bundled = url.isFileURL && url.standardizedFileURL.path.hasPrefix(directory.standardizedFileURL.path + "/")
        decisionHandler(bundled ? .allow : .cancel)
    }

    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .portrait }
    override var prefersStatusBarHidden: Bool { true }
    deinit { NotificationCenter.default.removeObserver(self) }
}
