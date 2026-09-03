import UIKit
import AVFoundation

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {

        // Audio session – must run on main thread
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("AVAudioSession error: \(error)")
        }

        // If scenes are not supported, fallback to window creation here
        if #available(iOS 13.0, *) {
            // SceneDelegate will handle window creation
        } else {
            let win = UIWindow(frame: UIScreen.main.bounds)
            win.backgroundColor = UIColor(red: 8/255, green: 20/255, blue: 12/255, alpha: 1.0)
            win.rootViewController = ViewController()
            self.window = win
            win.makeKeyAndVisible()
        }

        return true
    }
}
