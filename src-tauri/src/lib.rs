use tauri::WebviewUrl;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let url = WebviewUrl::External("https://alectra.co.za".parse().unwrap());
            tauri::WebviewWindowBuilder::new(app, "main", url)
                .title("Alectra Solutions")
                .inner_size(390.0, 844.0)
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
