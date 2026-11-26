import Foundation
import Capacitor
import StoreKit

/// StoreKit 2 bridge for the one-time "Fire Task Plus" unlock (a non-consumable).
///
/// All verification happens here. A transaction that fails StoreKit's
/// verification is reported as "unverified" and never counts as an entitlement.
/// "Could not find out" (offline, StoreKit hiccup) is reported as "unknown",
/// never as "not purchased" — the JS side keeps whatever was already verified.
///
/// JS contract: src/plus/nativePurchaseService.ts
///   getProduct    -> { found, displayPrice?, canMakePayments }
///   getEntitlement-> { state: "entitled" | "notEntitled" | "unknown" }
///   purchase      -> { outcome: "success" | "cancelled" | "pending" | "unverified" | "failed" | "restricted" }
///   restore       -> { outcome: "restored" | "nothing" | "unavailable" }
///   event "entitlementChanged" -> { state: "granted" | "revoked" }   (Transaction.updates)
@objc(PlusStorePlugin)
public class PlusStorePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PlusStorePlugin"
    public let jsName = "PlusStore"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProduct", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getEntitlement", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
    ]

    /// Keep in sync with src/plus/plusConstants.ts and App Store Connect.
    static let defaultProductId = "com.sunpotflower.sumplesfire.plus"

    private var updatesTask: Task<Void, Never>?

    private func productId(for call: CAPPluginCall) -> String {
        call.getString("productId") ?? PlusStorePlugin.defaultProductId
    }

    // MARK: - Lifecycle

    /// Start listening for transactions that finish outside a button press:
    /// Ask to Buy approvals, purchases made on another device, refunds.
    /// Must be running from launch, otherwise those would be missed.
    public override func load() {
        updatesTask = Task.detached(priority: .background) { [weak self] in
            for await result in Transaction.updates {
                guard let self = self else { return }
                await self.handle(update: result)
            }
        }
    }

    deinit {
        updatesTask?.cancel()
    }

    private func handle(update result: VerificationResult<Transaction>) async {
        switch result {
        case .verified(let transaction):
            guard transaction.productID == PlusStorePlugin.defaultProductId else {
                await transaction.finish()
                return
            }
            if transaction.revocationDate != nil {
                notifyListeners("entitlementChanged", data: ["state": "revoked"])
            } else {
                notifyListeners("entitlementChanged", data: ["state": "granted"])
            }
            // The app reacts to the event above before the transaction is finished.
            await transaction.finish()
        case .unverified:
            // Never grant on a transaction that failed verification.
            break
        }
    }

    // MARK: - Product

    @objc func getProduct(_ call: CAPPluginCall) {
        let id = productId(for: call)
        Task {
            let canPay = SKPaymentQueue.canMakePayments()
            do {
                let products = try await Product.products(for: [id])
                if let product = products.first {
                    call.resolve([
                        "found": true,
                        "displayPrice": product.displayPrice,
                        "canMakePayments": canPay,
                    ])
                } else {
                    call.resolve(["found": false, "canMakePayments": canPay])
                }
            } catch {
                call.resolve(["found": false, "canMakePayments": canPay])
            }
        }
    }

    // MARK: - Entitlement

    /// Ownership as verified on this device. Works offline: StoreKit keeps the
    /// signed transactions locally. A revoked (refunded) transaction is not owned.
    private static func entitlementState(for id: String) async -> String {
        var sawUnverified = false
        for await result in Transaction.currentEntitlements {
            switch result {
            case .verified(let transaction):
                if transaction.productID == id && transaction.revocationDate == nil {
                    return "entitled"
                }
            case .unverified(let transaction, _):
                if transaction.productID == id { sawUnverified = true }
            }
        }
        // A transaction exists but could not be verified: we cannot say "not purchased".
        return sawUnverified ? "unknown" : "notEntitled"
    }

    @objc func getEntitlement(_ call: CAPPluginCall) {
        let id = productId(for: call)
        Task {
            call.resolve(["state": await PlusStorePlugin.entitlementState(for: id)])
        }
    }

    // MARK: - Purchase

    @objc func purchase(_ call: CAPPluginCall) {
        let id = productId(for: call)
        Task {
            guard SKPaymentQueue.canMakePayments() else {
                call.resolve(["outcome": "restricted"])
                return
            }

            do {
                guard let product = try await Product.products(for: [id]).first else {
                    call.resolve(["outcome": "failed"])
                    return
                }

                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        if transaction.revocationDate != nil {
                            call.resolve(["outcome": "failed"])
                        } else {
                            // Hand the entitlement to the app first, then finish the transaction.
                            call.resolve(["outcome": "success"])
                            await transaction.finish()
                        }
                    case .unverified:
                        // Leave it unfinished: StoreKit will redeliver it through Transaction.updates.
                        call.resolve(["outcome": "unverified"])
                    }
                case .userCancelled:
                    call.resolve(["outcome": "cancelled"])
                case .pending:
                    // Ask to Buy / extra authentication. Completion arrives via Transaction.updates.
                    call.resolve(["outcome": "pending"])
                @unknown default:
                    call.resolve(["outcome": "failed"])
                }
            } catch let error as Product.PurchaseError {
                if case .purchaseNotAllowed = error {
                    call.resolve(["outcome": "restricted"])
                } else {
                    call.resolve(["outcome": "failed"])
                }
            } catch {
                call.resolve(["outcome": "failed"])
            }
        }
    }

    // MARK: - Restore

    /// Explicit restore. Only ever called from the person's tap on "購入を復元":
    /// AppStore.sync() can ask them to sign in, so it must not run on launch.
    /// This restores the Plus entitlement only — never any task data.
    @objc func restore(_ call: CAPPluginCall) {
        let id = productId(for: call)
        Task {
            do {
                try await AppStore.sync()
            } catch {
                // Could not reach the store (or sign-in was dismissed). Say so;
                // never claim "nothing to restore".
                call.resolve(["outcome": "unavailable"])
                return
            }

            switch await PlusStorePlugin.entitlementState(for: id) {
            case "entitled": call.resolve(["outcome": "restored"])
            case "notEntitled": call.resolve(["outcome": "nothing"])
            default: call.resolve(["outcome": "unavailable"])
            }
        }
    }
}
