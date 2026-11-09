//! Small development helper:
//! `cargo run -p vectorme-core --example trace -- input.png output.svg`

use std::env;
use std::path::PathBuf;
use std::process::ExitCode;

use vectorme_core::{trace_file, Preset, TraceOptions};

fn main() -> ExitCode {
    let mut args = env::args().skip(1);
    let Some(input) = args.next() else {
        eprintln!("użycie: trace <wejście> [wyjście.svg] [logo|bw|photo]");
        return ExitCode::FAILURE;
    };

    let output = args.next().unwrap_or_else(|| {
        let mut path = PathBuf::from(&input);
        path.set_extension("svg");
        path.display().to_string()
    });
    let preset = args
        .next()
        .and_then(|name| match name.as_str() {
            "bw" => Some(Preset::Bw),
            "photo" => Some(Preset::Photo),
            "logo" => Some(Preset::Logo),
            _ => None,
        })
        .unwrap_or(Preset::Logo);

    let options = TraceOptions::for_preset(preset);
    match trace_file(&PathBuf::from(&input), &options) {
        Ok(result) => {
            if let Err(error) = std::fs::write(&output, &result.svg) {
                eprintln!("nie można zapisać {output}: {error}");
                return ExitCode::FAILURE;
            }
            println!(
                "{} → {} ({}×{}, {} ścieżek, {} kolorów, {} ms, {} B)",
                input,
                output,
                result.width,
                result.height,
                result.path_count,
                result.colors.len(),
                result.elapsed_ms,
                result.byte_size
            );
            for warning in result.warnings {
                eprintln!("warning: {warning:?}");
            }
            ExitCode::SUCCESS
        }
        Err(error) => {
            eprintln!("błąd: {error}");
            ExitCode::FAILURE
        }
    }
}
