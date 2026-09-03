import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let windowScene = (scene as? UIWindowScene) else { return }

        let appDelegate = UIApplication.shared.delegate as? AppDelegate
        let window = appDelegate?.window ?? UIWindow(windowScene: windowScene)
        window.windowScene = windowScene
        if window.rootViewController == nil {
            window.rootViewController = ViewController()
        }
        window.backgroundColor = UIColor(red: 8/255, green: 20/255, blue: 12/255, alpha: 1.0)
        self.window = window
        appDelegate?.window = window
        window.makeKeyAndVisible()
    }

    func sceneDidDisconnect(_ scene: UIScene) {}
    func sceneDidBecomeActive(_ scene: UIScene) {}
    func sceneWillResignActive(_ scene: UIScene) {}
    func sceneWillEnterForeground(_ scene: UIScene) {}
    func sceneDidEnterBackground(_ scene: UIScene) {}
}
