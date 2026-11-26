import UIKit
import Capacitor

/// The Capacitor web view controller, with the app's own native plugins registered.
/// (SceneDelegate creates this instead of the stock CAPBridgeViewController.)
class FireBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(PlusStorePlugin())
    }
}
