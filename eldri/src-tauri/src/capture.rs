use base64::{engine::general_purpose, Engine as _};
use image::{imageops::FilterType, DynamicImage, ImageFormat, RgbaImage};
use screenshots::Screen;
use std::io::Cursor;
use tauri::Window;

pub async fn capture_screen(window: Window) -> Result<String, String> {
    // 1. PHASE OUT: Hide the widget overlay so it doesn't capture itself
    window
        .hide()
        .map_err(|e| format!("Failed to hide window: {}", e))?;

    // Give the OS Window Manager ~180ms to repaint the background workspace fluidly
    tokio::time::sleep(std::time::Duration::from_millis(180)).await;

    // 2. CAPTURE PHASE: Grab the monitor layouts
    let screens = Screen::all().map_err(|e| format!("Screen scan failure: {}", e))?;
    if screens.is_empty() {
        window.show().ok(); // Fallback recovery safety
        return Err("No active screens detected by vision hardware core.".into());
    }

    // Capture the primary monitor array (or loop matching window coordinate bounds if preferred)
    let primary_screen = screens[0];
    let captured_frame = primary_screen
        .capture()
        .map_err(|e| format!("Capture blocked: {}", e))?;

    // 3. PHASE IN: Bring the widget immediately back into focus right as the flash occurs
    window
        .show()
        .map_err(|e| format!("Failed to restore window view: {}", e))?;
    window.set_focus().ok();

    // 4. OPTIMIZATION PHASE: Extract raw pixels and pass to image processor
    let width = captured_frame.width();
    let height = captured_frame.height();
    let raw_img = RgbaImage::from_raw(width, height, captured_frame.into_raw())
        .ok_or_else(|| "Failed to index screen buffer matrix safely.".to_string())?;
    let dynamic_img = DynamicImage::ImageRgba8(raw_img);

    // Downscale target if width exceeds standard 1280px container bounds (preserves crisp proportions)
    let target_width = 1280;
    let processed_img = if width > target_width {
        let reduction_ratio = target_width as f32 / width as f32;
        let target_height = (height as f32 * reduction_ratio) as u32;

        // Lanczos3 provides incredibly clean text sharpening during downscaling
        dynamic_img.resize(target_width, target_height, FilterType::Lanczos3)
    } else {
        dynamic_img
    };

    // 5. COMPRESSION PHASE: Write out as a low-overhead, optimized JPEG stream
    let mut image_bytes_buffer = Vec::new();
    let mut memory_cursor = Cursor::new(&mut image_bytes_buffer);

    // Convert to standard JPEG matrix (drops raw data footprints by massive ratios)
    processed_img
        .write_to(&mut memory_cursor, ImageFormat::Jpeg)
        .map_err(|e| format!("Image compilation compression write failure: {}", e))?;

    // 6. ENCODE PHASE: Translate bytes straight to standard inline base64 URI
    let base64_payload = general_purpose::STANDARD.encode(&image_bytes_buffer);

    Ok(format!("data:image/jpeg;base64,{}", base64_payload))
}
