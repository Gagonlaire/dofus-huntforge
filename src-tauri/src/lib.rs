mod data;

#[tauri::command]
fn get_hints_for_direction(x: i32, y: i32, direction: i8) -> std::collections::HashMap<u32, data::Hint> {
    use std::collections::HashMap;

    if direction >= 4 || direction < 0 {
        return HashMap::new();
    }

    let hint_steps = data::get_hints(x, y)
        .and_then(|hints| hints.get(direction as usize))
        .and_then(|hints| hints.as_deref())
        .unwrap_or(&[]);
    let mut closest_hints: HashMap<u32, data::Hint> = HashMap::new();

    for step in hint_steps {
        for &hint_id in step.hint_ids {
            let names = match data::get_names(hint_id) {
                Some(names) => names,
                None => {
                    log::warn!("Missing names for hint ID {}", hint_id);
                    continue;
                }
            };

            let hint = data::Hint {
                names,
                x: step.x,
                y: step.y,
                dist: step.dist,
            };

            closest_hints.entry(hint_id)
                .and_modify(|existing| {
                    if step.dist < existing.dist {
                        *existing = hint.clone();
                    }
                })
                .or_insert(hint);
        }
    }

    closest_hints
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_hints_for_direction])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
