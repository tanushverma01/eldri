use base64::{engine::general_purpose, Engine as _};
use image::{imageops::FilterType, DynamicImage, ImageFormat, RgbaImage};
use screenshots::Screen;
use std::io::Cursor;
use tauri::Window;

pub async fn capture_screen(window: Window) -> Result<String, String> {
    let pos = window
        .outer_position()
        .map_err(|e| format!("Window position query failed: {}", e))?;
    let (wx, wy) = (pos.x, pos.y);

    window
        .hide()
        .map_err(|e| format!("Failed to hide window: {}", e))?;

    tokio::time::sleep(std::time::Duration::from_millis(180)).await;

    let screens = Screen::all().map_err(|e| format!("Screen scan failure: {}", e))?;
    if screens.is_empty() {
        window.show().ok();
        return Err("No active screens detected.".into());
    }

    let mut target = screens[0];
    for screen in &screens {
        let info = screen.display_info;
        let (sx, sy, sw, sh) = (
            info.x as i32,
            info.y as i32,
            info.width as i32,
            info.height as i32,
        );
        if wx >= sx && wx <= (sx + sw) && wy >= sy && wy <= (sy + sh) {
            target = *screen;
            break;
        }
    }

    let captured_frame = target
        .capture()
        .map_err(|e| format!("Capture blocked: {}", e))?;

    window
        .show()
        .map_err(|e| format!("Failed to restore window view: {}", e))?;
    window.set_focus().ok();

    let width = captured_frame.width();
    let height = captured_frame.height();
    let raw_img = RgbaImage::from_raw(width, height, captured_frame.into_raw())
        .ok_or_else(|| "Failed to index screen buffer matrix safely.".to_string())?;
    let dynamic_img = DynamicImage::ImageRgba8(raw_img);

    let target_width = 1280;
    let processed_img = if width > target_width {
        let reduction_ratio = target_width as f32 / width as f32;
        let target_height = (height as f32 * reduction_ratio) as u32;
        dynamic_img.resize(target_width, target_height, FilterType::Lanczos3)
    } else {
        dynamic_img
    };

    let mut image_bytes_buffer = Vec::new();
    let mut memory_cursor = Cursor::new(&mut image_bytes_buffer);
    processed_img
        .write_to(&mut memory_cursor, ImageFormat::Jpeg)
        .map_err(|e| format!("Image compression write failure: {}", e))?;

    let base64_payload = general_purpose::STANDARD.encode(&image_bytes_buffer);
    Ok(format!("data:image/jpeg;base64,{}", base64_payload))
}
