pub mod capture;

use keyring::Entry;

pub async fn save_secure_key(provider: String, key: String) -> Result<(), String> {
    if key.trim().is_empty() {
        return Ok(());
    }
    let vault_entry = Entry::new("eldri_godmode_vault", &provider)
        .map_err(|e| format!("Vault init failed: {}", e))?;
    vault_entry
        .set_password(&key)
        .map_err(|e| format!("Vault write failed: {}", e))?;
    Ok(())
}

pub async fn get_secure_key(provider: String) -> Result<String, String> {
    let vault_entry = Entry::new("eldri_godmode_vault", &provider)
        .map_err(|e| format!("Vault init failed: {}", e))?;
    match vault_entry.get_password() {
        Ok(token) => Ok(token),
        Err(_) => Ok(String::new()),
    }
}

#[cfg(not(any(target_os = "android", target_os = "ios")))]
pub fn setup_tray(app: &tauri::App) -> tauri::Result<()> {
    use tauri::menu::{Menu, MenuItem};
    use tauri::tray::TrayIconBuilder;
    use tauri::Manager;

    let show_i = MenuItem::with_id(app, "show", "Show Eldri Dashboard", true, None::<&str>)?;
    let widget_i = MenuItem::with_id(app, "widget", "Show Vision Widget", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit Application", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_i, &widget_i, &quit_i])?;

    let icon = app
        .default_window_icon()
        .ok_or_else(|| tauri::Error::FailedToReceiveMessage)?
        .clone();

    let _tray = TrayIconBuilder::new()
        .icon(icon)
        .menu(&menu)
        .tooltip("Eldri Godmode")
        .on_menu_event(|app_handle, event| match event.id.as_ref() {
            "quit" => app_handle.exit(0),
            "show" => {
                if let Some(win) = app_handle.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.unminimize();
                    let _ = win.set_focus();
                }
            }
            "widget" => {
                if let Some(win) = app_handle.get_webview_window("widget") {
                    let _ = win.show();
                    let _ = win.set_focus();
                }
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            use tauri::tray::{MouseButton, MouseButtonState, TrayIconEvent};
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.unminimize();
                    let _ = win.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[tauri::command]
    async fn capture_screen(window: tauri::Window) -> Result<String, String> {
        capture::capture_screen(window).await
    }

    #[tauri::command]
    async fn save_secure_key_cmd(provider: String, key: String) -> Result<(), String> {
        save_secure_key(provider, key).await
    }

    #[tauri::command]
    async fn get_secure_key_cmd(provider: String) -> Result<String, String> {
        get_secure_key(provider).await
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            capture_screen,
            save_secure_key_cmd,
            get_secure_key_cmd
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
