use std::io::prelude::*;
use std::{fs};
use std::path::Path;

fn main() {
    println!("cargo:rerun-if-changed=data/names.json");
    println!("cargo:rerun-if-changed=data/hints.json");
    fs::create_dir_all("src/data").unwrap();

    let dest_path = Path::new("src/data/generated.rs");
    let mut file = fs::File::create(&dest_path).unwrap();

    generate_names(&mut file);
    generate_hints(&mut file);

    tauri_build::build()
}

fn generate_names(file: &mut fs::File) {
    let data = fs::read_to_string("data/names.json").expect("Failed to read names.json");
    let map: serde_json::Value = serde_json::from_str(&data).expect("Failed to parse names.json");

    let mut builder = phf_codegen::Map::new();
    for (id, translations) in map.as_object().expect("Names data should be an object") {
        let trans_obj = translations.as_object().expect("Translation should be an object");
        let value = format!(
            "HintName {{
                    de: \"{}\",
                    en: \"{}\",
                    es: \"{}\",
                    fr: \"{}\",
                    it: \"{}\",
                    pt: \"{}\"
                }}",
            trans_obj["de"].as_str().expect("de should be a string"),
            trans_obj["en"].as_str().expect("en should be a string"),
            trans_obj["es"].as_str().expect("es should be a string"),
            trans_obj["fr"].as_str().expect("fr should be a string"),
            trans_obj["it"].as_str().expect("it should be a string"),
            trans_obj["pt"].as_str().expect("pt should be a string"),
        );

        let leaked_value: &'static str = Box::leak(value.into_boxed_str());
        builder.entry(
            id.parse::<u32>().expect("ID should be a number"),
            leaked_value,
        );
    }

    writeln!(file, "pub static NAMES: phf::Map<u32, HintName> = {};\n", builder.build()).unwrap();
}

fn generate_hints(file: &mut fs::File) {
    let data = fs::read_to_string("data/hints.json").expect("Failed to read hints.json");
    let map: serde_json::Value = serde_json::from_str(&data).expect("Failed to parse hints.json");
    let mut builder = phf_codegen::Map::new();

    for (coords, directions) in map.as_object().expect("Hints data should be an object") {
        let dirs = directions.as_array().expect("Directions should be an array");
        let formatted = format!(
            "[{}, {}, {}, {}]",
            format_direction(&dirs[0]),
            format_direction(&dirs[1]),
            format_direction(&dirs[2]),
            format_direction(&dirs[3])
        );
        let leaked: &'static str = Box::leak(formatted.into_boxed_str());
        builder.entry(
            coords.as_str(),
            leaked
        );
    }

    writeln!(
        file,
        "pub static HINTS: phf::Map<&'static str, [Option<&'static [HintStep]>; 4]> = {};\n",
        builder.build()
    ).unwrap();
}

fn format_direction(value: &serde_json::Value) -> String {
    if value.is_null() {
        "None".to_string()
    } else {
        let steps = value.as_array().expect("Steps should be an array");
        let mut entries = Vec::new();
        for step in steps {
            let s = step.as_object().expect("Step should be an object");
            entries.push(format!(
                "HintStep {{
                    dist: {},
                    x: {},
                    y: {},
                    hint_ids: &{:?}
                }}",
                s["d"].as_u64().expect("d should be a number") as u32,
                s["x"].as_i64().expect("x should be a number") as i32,
                s["y"].as_i64().expect("y should be a number") as i32,
                s["ids"].as_array().expect("ids should be an array")
                    .iter()
                    .map(|v| v.as_u64().expect("id should be a number") as u32)
                    .collect::<Vec<u32>>()
            ));
        }
        format!("Some(&[{}])", entries.join(", "))
    }
}