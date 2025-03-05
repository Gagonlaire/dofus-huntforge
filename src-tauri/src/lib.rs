mod data;

use crate::data::NAME_DATA;
use serde_json::Value;
use std::collections::HashMap;
use tauri::path::BaseDirectory;
use tauri::{Manager, State};

struct Data {
    data: Value
}

#[tauri::command]
fn get_hints_for_direction(state: State<'_, Data>, x: i64, y: i64) -> Vec<Value> {
    let key_value = state.data.get(format!("{},{}", x, y)).unwrap();

    key_value.as_array().unwrap().clone()
}

#[tauri::command]
fn get_names_for_ids(ids: Vec<i64>, lang: &str) -> HashMap<i64, &str> {
    let mut names_hash_map: HashMap<i64, &str> = HashMap::new();

    for id in ids {
        let names = NAME_DATA.get(&id.to_string());

        if let Some(names) = names {
            let name = match lang {
                "fr" => names.fr,
                "en" => names.en,
                "es" => names.es,
                _ => names.fr,
            };

            names_hash_map.insert(id, name);
        }
    }

    names_hash_map
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let resource_path = app
                .path()
                .resolve("../data/data.json", BaseDirectory::Resource)
                .unwrap();
            let file = std::fs::File::open(&resource_path).unwrap();
            let data = serde_json::from_reader(file).unwrap();

            app.manage(Data { data });

            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_hints_for_direction,
            get_names_for_ids
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
