use quote::quote;
use serde_json::Value;
use std::fs;
use std::path::Path;

// todo: rename files to 'names' and 'hints'
const HINTS_DATA_FILE_PATH: &str = "../data/data.json";
const NAMES_DATA_FILE_PATH: &str = "../data/nameIdData.json";
const INPUT_FOLDER: &str = "../data";
const OUTPUT_FOLDER: &str = "gen/data";

fn main() {
    tauri_build::build();
    println!("cargo:rerun-if-changed={}", HINTS_DATA_FILE_PATH);
    println!("cargo:rerun-if-changed={}", NAMES_DATA_FILE_PATH);

    let name_data = read_parse_json(NAMES_DATA_FILE_PATH);

    generate_name_data(&name_data, OUTPUT_FOLDER);
}

fn read_parse_json(path: &str) -> Value {
    let file_content = fs::read_to_string(path).expect("Unable to read file");

    let json = serde_json::from_str(&file_content).expect("Unable to parse json");

    json
}

fn generate_name_data(data: &Value, output_path: &str) {
    let path = Path::new(output_path);

    if !path.exists() {
        fs::create_dir_all(path).expect("Unable to create output directory");
    } else if !path.is_dir() {
        panic!("The provided output path is not a directory: {:?}", path);
    }

    let mut static_data = vec![];

    if let Value::Object(map) = data {
        for (key, value) in map {
            if let Value::Object(inner) = value {
                let de = inner.get("de").and_then(Value::as_str).unwrap_or("");
                let en = inner.get("en").and_then(Value::as_str).unwrap_or("");
                let es = inner.get("es").and_then(Value::as_str).unwrap_or("");
                let fr = inner.get("fr").and_then(Value::as_str).unwrap_or("");
                let it = inner.get("it").and_then(Value::as_str).unwrap_or("");
                let pt = inner.get("pt").and_then(Value::as_str).unwrap_or("");

                static_data.push(quote! {
                    map.insert(#key.to_string(), Names {
                        de: #de,
                        en: #en,
                        es: #es,
                        fr: #fr,
                        it: #it,
                        pt: #pt,
                    });
                });
            }
        }
    }

    let generated_code = quote! {
        #[derive(Clone, Debug)]
        pub struct Names {
            pub de: &'static str,
            pub en: &'static str,
            pub es: &'static str,
            pub fr: &'static str,
            pub it: &'static str,
            pub pt: &'static str,
        }

        lazy_static! {
            pub static ref NAME_DATA: HashMap<String, Names> = {
                let mut map = HashMap::new();
                #(#static_data)*
                map
            };
        }
    };
    let output_file = path.join("names.rs");

    fs::write(output_file.clone(), generated_code.to_string())
        .expect("Unable to write generated file");
    println!("Generated file written to: {:?}", output_file);
}

fn generate_hints_data(data: &Value, output_path: &str) {
    let path = Path::new(output_path);

    if !path.exists() {
        fs::create_dir_all(path).expect("Unable to create output directory");
    } else if !path.is_dir() {
        panic!("The provided output path is not a directory: {:?}", path);
    }

    let mut static_data = vec![];

    if let Value::Object(map) = data {
        for (key, value) in map {
            if let Value::Array(directions) = value {
                if directions.len() != 4 {
                    panic!(
                        "Coordinates should have 4 directions, found: {}",
                        directions.len()
                    );
                }

                let mut directions_data = vec![];

                for direction in directions {
                    if direction.is_null() {
                        directions_data.push(quote! { None });
                    } else if let Value::Array(hints) = direction {
                        let mut hints_data = vec![];

                        for hint in hints {
                            if let Value::Object(hint_data) = hint {
                                let distance =
                                    hint_data.get("d").and_then(Value::as_i64).unwrap_or(0);
                                let x = hint_data.get("x").and_then(Value::as_i64).unwrap_or(0);
                                let y = hint_data.get("y").and_then(Value::as_i64).unwrap_or(0);
                                let ids: Vec<i64> = hint_data
                                    .get("ids")
                                    .and_then(Value::as_array)
                                    .unwrap_or(&vec![])
                                    .iter()
                                    .filter_map(Value::as_i64)
                                    .collect();

                                hints_data.push(quote! {
                                    Hint {
                                        d: #distance,
                                        x: #x,
                                        y: #y,
                                        ids: vec![#(#ids),*],
                                    }
                                });
                            }
                        }

                        directions_data.push(quote! { Some(vec![#(#hints_data),*]) });
                    }
                }

                static_data.push(quote! {
                    map.insert(#key.to_string(), [#(#directions_data),*]);
                });
            }
        }
    }

    let static_data_len = static_data.len();
    let generated_code = quote! {
        #[derive(Clone, Debug)]
        pub struct Hint {
            pub d: i64,
            pub x: i64,
            pub y: i64,
            pub ids: Vec<i64>,
        }

        lazy_static! {
            pub static ref HINTS_DATA: HashMap<String, [Option<Vec<Hint>>; 4]> = {
                let mut map = HashMap::with_capacity(#static_data_len);
                #(#static_data)*
                map
            };
        }
    };
    let output_file = path.join("hints.rs");

    fs::write(output_file.clone(), generated_code.to_string())
        .expect("Unable to write generated file");
    println!("Generated file written to: {:?}", output_file);
}
