// Prevents additional console window on Windows in release, do not remove!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Deserialize;
use tauri::{Manager, Window, State};

#[derive(Deserialize)]
struct AiRequest {
    provider: String,
    model: String,
    api_key: String,
    image_base64: String,
    prompt: String,
}

#[tauri::command]
async fn capture_screen(window: Window) -> Result<String, String> {
    eldri_lib::capture::capture_screen(window).await
}

#[tauri::command]
async fn save_secure_key(provider: String, key: String) -> Result<(), String> {
    eldri_lib::save_secure_key(provider, key).await
}

#[tauri::command]
async fn get_secure_key(provider: String) -> Result<String, String> {
    eldri_lib::get_secure_key(provider).await
}

#[tauri::command]
async fn analyze_with_eldri(
    req: AiRequest,
    client: State<'_, reqwest::Client>
) -> Result<String, String> {
    let image_b64 = req
        .image_base64
        .strip_prefix("data:image/jpeg;base64,")
        .or_else(|| req.image_base64.strip_prefix("data:image/png;base64,"))
        .unwrap_or(&req.image_base64);
    let image_mime = if req.image_base64.contains("image/jpeg") {
        "image/jpeg"
    } else {
        "image/png"
    };

    match req.provider.as_str() {
        "openai" | "groq" | "openrouter" | "deepseek" => {
            let url = match req.provider.as_str() {
                "groq" => "https://api.groq.com/openai/v1/chat/completions",
                "openrouter" => "https://openrouter.ai/api/v1/chat/completions",
                "deepseek" => "https://api.deepseek.com/v1/chat/completions",
                _ => "https://api.openai.com/v1/chat/completions",
            };

            let response = client
                .post(url)
                .header("Authorization", format!("Bearer {}", req.api_key))
                .json(&serde_json::json!({
                    "model": req.model,
                    "messages": [{
                        "role": "user",
                        "content": [
                            { "type": "text", "text": req.prompt },
                            { "type": "image_url", "image_url": { "url": format!("data:{};base64,{}", image_mime, image_b64) } }
                        ]
                    }],
                    "max_tokens": 4096
                }))
                .send()
                .await
                .map_err(|e| format!("Network request failed for provider '{}': {}", req.provider, e))?;

            if !response.status().is_success() {
                let status = response.status();
                let body = response.text().await.unwrap_or_default();
                return Err(format!("API error ({}): {}", status, body));
            }

            let res: serde_json::Value = response.json().await.map_err(|e| format!("Failed to parse response: {}", e))?;
            Ok(res["choices"][0]["message"]["content"]
                .as_str()
                .unwrap_or("No response generated.")
                .to_string())
        }
        "anthropic" => {
            let response = client
                .post("https://api.anthropic.com/v1/messages")
                .header("x-api-key", &req.api_key)
                .header("anthropic-version", "2023-06-01")
                .json(&serde_json::json!({
                    "model": req.model,
                    "max_tokens": 4096,
                    "messages": [{
                        "role": "user",
                        "content": [
                            { "type": "image", "source": { "type": "base64", "media_type": image_mime, "data": image_b64 }},
                            { "type": "text", "text": req.prompt }
                        ]
                    }]
                }))
                .send()
                .await
                .map_err(|e| format!("Anthropic request failed: {}", e))?;

            if !response.status().is_success() {
                let status = response.status();
                let body = response.text().await.unwrap_or_default();
                return Err(format!("Anthropic API error ({}): {}", status, body));
            }

            let res: serde_json::Value = response.json().await.map_err(|e| format!("Failed to parse Anthropic response: {}", e))?;
            Ok(res["content"][0]["text"]
                .as_str()
                .unwrap_or("No response generated.")
                .to_string())
        }
        "gemini" => {
            // Gemini uses the OpenAI-compatible endpoint
            let response = client
                .post("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions")
                .header("Authorization", format!("Bearer {}", req.api_key))
                .json(&serde_json::json!({
                    "model": req.model,
                    "messages": [{
                        "role": "user",
                        "content": [
                            { "type": "text", "text": req.prompt },
                            { "type": "image_url", "image_url": { "url": format!("data:{};base64,{}", image_mime, image_b64) } }
                        ]
                    }],
                    "max_tokens": 4096
                }))
                .send()
                .await
                .map_err(|e| format!("Gemini request failed: {}", e))?;

            if !response.status().is_success() {
                let status = response.status();
                let body = response.text().await.unwrap_or_default();
                return Err(format!("Gemini API error ({}): {}", status, body));
            }

            let res: serde_json::Value = response.json().await.map_err(|e| format!("Failed to parse Gemini response: {}", e))?;
            Ok(res["choices"][0]["message"]["content"]
                .as_str()
                .unwrap_or("No response generated.")
                .to_string())
        }
        _ => Err(format!("Provider '{}' is not supported. Use openai, anthropic, groq, openrouter, deepseek, or gemini.", req.provider)),
    }
}

fn main() {
    // Shared HTTP client with connection pool for fast provider streaming
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .pool_idle_timeout(std::time::Duration::from_secs(90))
        .pool_max_idle_per_host(5)
        .build()
        .unwrap_or_else(|_| reqwest::Client::new());

    let mut builder = tauri::Builder::default()
        .manage(client)
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            capture_screen,
            analyze_with_eldri,
            save_secure_key,
            get_secure_key
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
        });

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        builder = builder
            .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
                println!("New instance deep link argv: {:?}", argv);
                let _ = app.get_webview_window("main").map(|w| {
                    let _ = w.show();
                    let _ = w.unminimize();
                    let _ = w.set_focus();
                });
            }))
            .plugin(tauri_plugin_deep_link::init())
            .plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .build(),
            )
            .setup(|app| {
                eldri_lib::setup_tray(app)?;

                use tauri_plugin_global_shortcut::{ShortcutState, GlobalShortcutExt};
                let handle = app.handle().clone();
                let widget_handle = handle.clone();
                handle.global_shortcut().on_shortcut("Ctrl+Shift+E", move |_app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        if let Some(w) = widget_handle.get_webview_window("widget") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                })?;

                Ok(())
            });
    }

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
