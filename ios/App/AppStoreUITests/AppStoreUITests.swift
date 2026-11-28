import StoreKitTest
import XCTest

final class AppStoreUITests: XCTestCase {
    private let productID = "com.sunpotflower.sumplesfire.plus"
    private let sampleTitle = "確定申告の書類をそろえる"
    private let app = XCUIApplication(bundleIdentifier: "com.sunpotflower.sumplesfire")

    override func setUpWithError() throws {
        continueAfterFailure = false
#if !targetEnvironment(simulator)
        throw XCTSkip("Run on a dedicated simulator. These tests use a local StoreKit configuration.")
#endif
        app.launchArguments = ["-AppleLanguages", "(ja)", "-AppleLocale", "ja_JP"]
    }

    func testTaskPersistsAndFireCanBeUndone() {
        let title = "Review \(Int(Date().timeIntervalSince1970))"
        launchApp()
        let firstTask = app.buttons["最初のタスクを書く"]
        if firstTask.exists {
            firstTask.tap()
        } else {
            tap(app.buttons["燃やしたいタスクを書く"])
        }
        let titleField = app.textFields.firstMatch
        tap(titleField)
        titleField.typeText(title)
        XCTAssertEqual(titleField.value as? String, title)
        let submit = app.buttons["タスクを薪にする"]
        reveal(submit)
        let keyboard = app.keyboards.firstMatch
        if keyboard.exists {
            let accessory = app.toolbars.firstMatch
            let keyboardTop = accessory.exists ? min(accessory.frame.minY, keyboard.frame.minY) : keyboard.frame.minY
            XCTAssertLessThanOrEqual(submit.frame.maxY, keyboardTop, "Save must stay above the software keyboard")
        }
        submit.tap()
        let fire = app.buttons["「\(title)」を完了してFire"]
        XCTAssertTrue(fire.waitForExistence(timeout: 25))

        app.terminate()
        launchApp()
        tap(fire)
        tap(app.buttons["「\(title)」のFireを元に戻す"])
        XCTAssertTrue(fire.waitForExistence(timeout: 25))
    }

    func testLocalStoreKitPurchaseRestoreAndRefund() throws {
        let store = try makeTestStore()
        defer {
            store.clearTransactions()
            store.resetToDefaultState()
        }
        launchApp()
        openPurchase()
        let buy = purchaseButton()
        reveal(buy)
        attachScreenshot("iap-review")
        buy.tap()
        XCTAssertTrue(text(containing: "Plusをご購入いただき").waitForExistence(timeout: 15))
        tap(app.buttons["今は閉じる"])
        XCTAssertTrue(text(containing: "購入済み").waitForExistence(timeout: 10))

        app.terminate()
        launchApp()
        tap(app.buttons["設定"])
        XCTAssertTrue(text(containing: "購入済み").waitForExistence(timeout: 10))
        tapSettingsAction("購入を復元")
        XCTAssertTrue(text(containing: "Plusの購入を復元しました").waitForExistence(timeout: 40))

        let transaction = try XCTUnwrap(store.allTransactions().first { $0.productIdentifier == productID })
        try store.refundTransaction(identifier: transaction.identifier)
        XCTAssertTrue(app.buttons["くわしく見る"].waitForExistence(timeout: 15))
    }

    func testCaptureStoreScreenshots() throws {
        launchApp()
        guard app.buttons["「\(sampleTitle)」を完了してFire"].waitForExistence(timeout: 10) else {
            throw XCTSkip("Seed the dedicated simulator with scripts/app-store-screenshots.sh before capturing.")
        }
        attachScreenshot("01-home")

        tap(app.buttons["「\(sampleTitle)」を完了してFire"])
        // Capture the fire after the overlay fades in and before it becomes ash.
        Thread.sleep(forTimeInterval: 0.85)
        attachScreenshot("02-fire-ritual")
        XCTAssertTrue(app.buttons["「\(sampleTitle)」のFireを元に戻す"].waitForExistence(timeout: 15))
        let dismissNotice = app.buttons["Fire通知を閉じる"]
        if dismissNotice.exists {
            dismissNotice.tap()
        }

        tap(app.buttons["炭"])
        XCTAssertTrue(text(containing: "炭の記録").waitForExistence(timeout: 10))
        attachScreenshot("03-ash-archive")

        tap(app.buttons["今日"])
        tap(app.buttons["燃やしたいタスクを書く"])
        XCTAssertTrue(app.textFields.firstMatch.waitForExistence(timeout: 10))
        let keyboard = app.keyboards.firstMatch
        if keyboard.exists {
            tap(app.toolbars.buttons["完了"])
            XCTAssertTrue(keyboard.waitForNonExistence(timeout: 10))
        }
        attachScreenshot("04-capture")
        tap(app.buttons["閉じる"])

        tap(app.buttons["設定"])
        XCTAssertTrue(text(containing: "体験とアプリ設定").waitForExistence(timeout: 10))
        attachScreenshot("05-settings")

        tapSettingsAction("くわしく見る")
        let preview = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "好きな炎を選ぶ")).firstMatch
        tap(preview)
        XCTAssertTrue(text(containing: "炎を選ぶ").waitForExistence(timeout: 10))
        attachScreenshot("06-plus")
    }

    private func launchApp(file: StaticString = #filePath, line: UInt = #line) {
        app.launch()
        XCTAssertTrue(app.buttons["今日"].waitForExistence(timeout: 45), "The task screen did not load", file: file, line: line)
    }

    private func openPurchase() {
        tap(app.buttons["設定"])
        tapSettingsAction("くわしく見る")
    }

    private func tapSettingsAction(_ label: String) {
        let action = app.buttons[label]
        reveal(action)
        if action.frame.midY >= app.buttons["今日"].frame.minY {
            // The WebView can report a click target behind the fixed tab bar on an iPhone SE.
            app.swipeUp()
        }
        tap(action)
    }

    private func purchaseButton() -> XCUIElement {
        app.buttons.matching(NSPredicate(format: "label ENDSWITH %@", "でPlusを購入")).firstMatch
    }

    private func text(containing value: String) -> XCUIElement {
        app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", value)).firstMatch
    }

    private func makeTestStore() throws -> SKTestSession {
        let bundle = Bundle(for: Self.self)
        let configuration = try XCTUnwrap(bundle.url(forResource: "Configuration", withExtension: "storekit"))
        let store = try SKTestSession(contentsOf: configuration)
        store.resetToDefaultState()
        store.clearTransactions()
        store.disableDialogs = true
        return store
    }

    private func attachScreenshot(_ name: String) {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    private func tap(_ element: XCUIElement, file: StaticString = #filePath, line: UInt = #line) {
        reveal(element, file: file, line: line)
        element.tap()
    }

    private func reveal(_ element: XCUIElement, file: StaticString = #filePath, line: UInt = #line) {
        XCTAssertTrue(element.waitForExistence(timeout: 25), "Element did not appear: \(element)", file: file, line: line)
        for _ in 0..<4 where !element.isHittable {
            app.swipeUp()
        }
        XCTAssertTrue(element.isHittable, "Element is outside the viewport: \(element)", file: file, line: line)
    }
}
