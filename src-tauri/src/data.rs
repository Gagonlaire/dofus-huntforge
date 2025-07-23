use phf;

#[derive(Debug, Clone)]
pub struct HintName {
    pub de: &'static str,
    pub en: &'static str,
    pub es: &'static str,
    pub fr: &'static str,
    pub it: &'static str,
    pub pt: &'static str,
}

#[derive(Debug, Clone)]
pub struct HintStep {
    pub dist: u32,
    pub x: i32,
    pub y: i32,
    pub hint_ids: &'static [u32],
}

include!("data/generated.rs");

pub fn get_names_map() -> &'static phf::Map<u32, HintName> {
    &NAMES
}

pub fn get_names(id: u32) -> Option<&'static HintName> {
    NAMES.get(&id)
}

pub fn get_hints_map() -> &'static phf::Map<&'static str, [Option<&'static [HintStep]>; 4]> {
    &HINTS
}

pub fn get_hints(coords: &str) -> Option<&'static [Option<&'static [HintStep]>; 4]> {
    HINTS.get(coords)
}
