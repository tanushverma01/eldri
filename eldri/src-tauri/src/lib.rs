pub mod capture;

use keyring::Entry;
use std::fs;
use std::path::PathBuf;

fn get_fallback_path() -> PathBuf {
    let mut path = if let Ok(profile) = std::env::var("USERPROFILE") {
        PathBuf::from(profile)
    } else {
        std::env::temp_dir()
    };
    path.push(".eldri_keys.json");
    path
}

fn save_key_fallback(provider: &str, key: &str) -> Result<(), String> {
    let path = get_fallback_path();
    let mut keys: serde_json::Value = if path.exists() {
        let content = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };
    
    keys[provider] = serde_json::json!(key);
    
    let content = serde_json::to_string_pretty(&keys)
        .map_err(|e| format!("Failed to serialize fallback keys: {}", e))?;
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write fallback keys file: {}", e))?;
    Ok(())
}

fn get_key_fallback(provider: &str) -> Result<String, String> {
    let path = get_fallback_path();
    if !path.exists() {
        return Ok(String::new());
    }
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read fallback keys file: {}", e))?;
    let keys: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse fallback keys: {}", e))?;
    
    if let Some(val) = keys.get(provider) {
        if let Some(s) = val.as_str() {
            return Ok(s.to_string());
        }
    }
    Ok(String::new())
}

pub async fn save_secure_key(provider: String, key: String) -> Result<(), String> {
    if key.trim().is_empty() {
        return Ok(());
    }
    match Entry::new("eldri_godmode_vault", &provider) {
        Ok(vault_entry) => {
            if let Err(e) = vault_entry.set_password(&key) {
                eprintln!("Keyring set_password failed: {}, falling back to file storage", e);
                save_key_fallback(&provider, &key)
            } else {
                Ok(())
            }
        }
        Err(e) => {
            eprintln!("Keyring Entry::new failed: {}, falling back to file storage", e);
            save_key_fallback(&provider, &key)
        }
    }
}

pub async fn get_secure_key(provider: String) -> Result<String, String> {
    match Entry::new("eldri_godmode_vault", &provider) {
        Ok(vault_entry) => {
            match vault_entry.get_password() {
                Ok(token) => {
                    if token.is_empty() {
                        get_key_fallback(&provider)
                    } else {
                        Ok(token)
                    }
                }
                Err(_) => {
                    get_key_fallback(&provider)
                }
            }
        }
        Err(_) => {
            get_key_fallback(&provider)
        }
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

// NOTE: The application entry point and full Tauri Builder (plugins, tray,
// global shortcuts, deep-link, single-instance, command handlers) live in
// `main.rs`. This library only exposes shared helpers used from there:
//   - `capture` module (screen capture command impl)
//   - `save_secure_key` / `get_secure_key` (OS keyring + fallbacks)
//   - `setup_tray` (system tray wiring)
// Do not add a second Builder/`run()` here — keep one source of truth in main.rs.
