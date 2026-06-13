// Prevents additional console window on Windows in release, do not remove!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Deserialize;
use tauri::{Manager, Window};

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
async fn analyze_with_eldri(req: AiRequest) -> Result<String, String> {
    let client = reqwest::Client::new();
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
        "openai" | "groq" => {
            let url = if req.provider == "groq" {
                "https://api.groq.com/openai/v1/chat/completions"
            } else {
                "https://api.openai.com/v1/chat/completions"
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
                    }]
                }))
                .send()
                .await
                .map_err(|e| e.to_string())?;

            let res: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
            Ok(res["choices"][0]["message"]["content"]
                .as_str()
                .unwrap_or("Eldri couldn't think of an answer.")
                .to_string())
        }
        "anthropic" => {
            let response = client
                .post("https://api.anthropic.com/v1/messages")
                .header("x-api-key", req.api_key)
                .header("anthropic-version", "2023-06-01")
                .json(&serde_json::json!({
                    "model": req.model,
                    "max_tokens": 1024,
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
                .map_err(|e| e.to_string())?;

            let res: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
            Ok(res["content"][0]["text"]
                .as_str()
                .unwrap_or("Eldri is silent.")
                .to_string())
        }
        _ => Err("Provider not implemented".into()),
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![capture_screen, analyze_with_eldri])
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::{Builder, ShortcutState};
                let handle = app.handle().clone();
                app.handle()
                    .plugin(
                        Builder::new()
                            .with_shortcuts(["Ctrl+Shift+E"])?
                            .with_handler(move |_app, _shortcut, event| {
                                if event.state == ShortcutState::Pressed {
                                    if let Some(w) = handle.get_webview_window("widget") {
                                        let _ = w.show();
                                        let _ = w.set_focus();
                                    }
                                }
                            })
                            .build(),
                    )
                    .ok();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
