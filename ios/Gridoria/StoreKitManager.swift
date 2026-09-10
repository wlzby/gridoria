import Foundation
import StoreKit

@available(iOS 15.0, *)
protocol StoreKitManagerDelegate: AnyObject {
    func storeKitDidPurchaseProduct(productId: String)
    func storeKitDidFailPurchase(productId: String, error: String)
    func storeKitDidRestorePurchases(productIds: [String])
}

@available(iOS 15.0, *)
class StoreKitManager: @unchecked Sendable {
    static let shared = StoreKitManager()

    weak var delegate: StoreKitManagerDelegate?

    // Defined Product IDs matching App Store Connect
    static let productIds: Set<String> = [
        "com.mawelly.gridoria.gems100",
        "com.mawelly.gridoria.gems500",
        "com.mawelly.gridoria.gems1200",
        "com.mawelly.gridoria.gems3000",
        "com.mawelly.gridoria.starterpack",
        "com.mawelly.gridoria.vip"
    ]

    private(set) var products: [String: Product] = [:]
    private var updateListenerTask: Task<Void, Error>? = nil

    private init() {
        updateListenerTask = listenForTransactions()
        Task {
            await fetchProducts()
        }
    }

    deinit {
        updateListenerTask?.cancel()
    }

    // MARK: - Fetch Products from Apple Servers
    func fetchProducts() async {
        do {
            let storeProducts = try await Product.products(for: StoreKitManager.productIds)
            var map: [String: Product] = [:]
            for product in storeProducts {
                map[product.id] = product
            }
            self.products = map
            print("✅ StoreKit: Loaded \(products.count) products successfully.")
        } catch {
            print("❌ StoreKit: Failed to fetch products: \(error.localizedDescription)")
        }
    }

    // MARK: - Purchase Product
    func purchase(productId: String) async {
        // If products aren't fetched yet, try fetching once
        if products.isEmpty {
            await fetchProducts()
        }

        guard let product = products[productId] else {
            print("ℹ️ StoreKit: Product '\(productId)' not returned by Apple live server (normal in Sideloadly/draft mode). Running test sandbox flow.")
            await promptFallbackTestPurchase(productId: productId)
            return
        }

        do {
            let result = try await product.purchase()

            switch result {
            case .success(let verification):
                let transaction = try checkVerified(verification)
                // Deliver content
                await MainActor.run {
                    self.delegate?.storeKitDidPurchaseProduct(productId: transaction.productID)
                }
                // Always finish the transaction after delivery
                await transaction.finish()
                print("✅ StoreKit: Purchase verified & finished for \(transaction.productID)")

            case .userCancelled:
                print("ℹ️ StoreKit: User cancelled purchase for \(productId)")
                await MainActor.run {
                    self.delegate?.storeKitDidFailPurchase(productId: productId, error: "Satın alma iptal edildi.")
                }

            case .pending:
                print("⏳ StoreKit: Purchase pending authorization for \(productId)")
                await MainActor.run {
                    self.delegate?.storeKitDidFailPurchase(productId: productId, error: "Satın alma onay bekliyor.")
                }

            @unknown default:
                break
            }
        } catch {
            print("❌ StoreKit: Purchase failed for \(productId): \(error.localizedDescription)")
            await MainActor.run {
                self.delegate?.storeKitDidFailPurchase(productId: productId, error: error.localizedDescription)
            }
        }
    }

    // MARK: - Restore Purchases (Required by Apple Review)
    func restorePurchases() async {
        var restoredIds: [String] = []

        do {
            // Synchronize with App Store
            try await AppStore.sync()

            // Check all current entitlements (e.g. VIP / Non-Consumables)
            for await result in Transaction.currentEntitlements {
                do {
                    let transaction = try checkVerified(result)
                    restoredIds.append(transaction.productID)
                } catch {
                    print("⚠️ StoreKit: Unverified transaction during restore: \(error)")
                }
            }

            // If Sideloadly mode without Apple server response, check local entitlement
            if restoredIds.isEmpty, UserDefaults.standard.bool(forKey: "gridoria_is_vip_purchased") {
                restoredIds.append("com.mawelly.gridoria.vip")
            }

            print("✅ StoreKit: Restored \(restoredIds.count) products: \(restoredIds)")
            await MainActor.run {
                self.delegate?.storeKitDidRestorePurchases(productIds: restoredIds)
            }
        } catch {
            print("❌ StoreKit: Restore failed: \(error.localizedDescription)")
            await MainActor.run {
                if UserDefaults.standard.bool(forKey: "gridoria_is_vip_purchased") {
                    self.delegate?.storeKitDidRestorePurchases(productIds: ["com.mawelly.gridoria.vip"])
                } else {
                    self.delegate?.storeKitDidFailPurchase(productId: "restore", error: error.localizedDescription)
                }
            }
        }
    }

    // MARK: - Sideloadly / Test Sandbox Flow
    private func promptFallbackTestPurchase(productId: String) async {
        await MainActor.run {
            let keyWindow = UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap { $0.windows }
                .first { $0.isKeyWindow }
            guard let rootVC = keyWindow?.rootViewController else {
                if productId == "com.mawelly.gridoria.vip" {
                    UserDefaults.standard.set(true, forKey: "gridoria_is_vip_purchased")
                }
                self.delegate?.storeKitDidPurchaseProduct(productId: productId)
                return
            }

            let name = self.nameFor(productId: productId)
            let alert = UIAlertController(
                title: "Sandbox / Test Satın Alma",
                message: "\(name)\n\n(Sideloadly / Test ortamında deneniyor. Apple test modunda hesabınızdan ücret çekilmez).",
                preferredStyle: .alert
            )

            alert.addAction(UIAlertAction(title: "Satın Al (Test)", style: .default, handler: { _ in
                if productId == "com.mawelly.gridoria.vip" {
                    UserDefaults.standard.set(true, forKey: "gridoria_is_vip_purchased")
                }
                self.delegate?.storeKitDidPurchaseProduct(productId: productId)
            }))

            alert.addAction(UIAlertAction(title: "İptal", style: .cancel, handler: { _ in
                self.delegate?.storeKitDidFailPurchase(productId: productId, error: "Satın alma iptal edildi.")
            }))

            rootVC.present(alert, animated: true, completion: nil)
        }
    }

    private func nameFor(productId: String) -> String {
        switch productId {
        case "com.mawelly.gridoria.gems100": return "100 Elmas (₺29.99)"
        case "com.mawelly.gridoria.gems500": return "500 Elmas (₺99.99)"
        case "com.mawelly.gridoria.gems1200": return "1.200 Elmas (₺199.99)"
        case "com.mawelly.gridoria.gems3000": return "3.000 Elmas (₺399.99)"
        case "com.mawelly.gridoria.starterpack": return "Başlangıç Paketi (₺49.99)"
        case "com.mawelly.gridoria.vip": return "VIP & Reklamsız Mod (₺299.99)"
        default: return "Gridoria Paketi"
        }
    }

    // MARK: - Transaction Verification
    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified(_, let error):
            throw error
        case .verified(let safe):
            return safe
        }
    }

    // MARK: - Background Transaction Listener
    private func listenForTransactions() -> Task<Void, Error> {
        return Task.detached {
            for await result in Transaction.updates {
                do {
                    let transaction = try self.checkVerified(result)
                    await MainActor.run {
                        if transaction.productID == "com.mawelly.gridoria.vip" {
                            UserDefaults.standard.set(true, forKey: "gridoria_is_vip_purchased")
                        }
                        self.delegate?.storeKitDidPurchaseProduct(productId: transaction.productID)
                    }
                    await transaction.finish()
                } catch {
                    print("⚠️ StoreKit: Unverified background transaction: \(error)")
                }
            }
        }
    }
}
