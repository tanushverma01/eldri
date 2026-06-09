// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

use screenshots::Screen;
use base64::{engine::general_purpose, Engine as _};
use image::codecs::png::PngEncoder;
use image::ExtendedColorType;
use image::ImageEncoder;

#[tauri::command]
async fn capture_screen() -> Result<String, String> {
    let screens = Screen::all().map_err(|e| e.to_string())?;

    if let Some(screen) = screens.first() {
        let image = screen.capture().map_err(|e| e.to_string())?;
        let (width, height) = (image.width(), image.height());
        let raw = image.into_raw();

        let mut png_bytes = Vec::new();
        PngEncoder::new(&mut png_bytes)
            .write_image(&raw, width, height, ExtendedColorType::Rgba8)
            .map_err(|e| e.to_string())?;

        let b64 = general_purpose::STANDARD.encode(&png_bytes);
        Ok(format!("data:image/png;base64,{}", b64))
    } else {
        Err("No screens found".into())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, capture_screen])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
