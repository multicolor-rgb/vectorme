/// Add a `viewBox` and a title to the SVG produced by VTracer.
///
/// `trace_width`/`trace_height` describe the coordinate space of the paths.
/// `output_width`/`output_height` are kept at the source image size, so the
/// saved file opens at the original dimensions while remaining fully scalable.
pub fn finalize(
    raw: &str,
    trace_width: u32,
    trace_height: u32,
    output_width: u32,
    output_height: u32,
) -> String {
    let replacement = format!(
        "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{output_width}\" height=\"{output_height}\" viewBox=\"0 0 {trace_width} {trace_height}\">"
    );

    // VTracer emits a fixed header. Replace it when possible and fall back to a
    // targeted insertion if a future version changes the spacing.
    let mut svg = raw.replacen(
        &format!(
            "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" width=\"{trace_width}\" height=\"{trace_height}\">"
        ),
        &replacement,
        1,
    );

    if !svg.contains("viewBox=") {
        svg = svg.replacen(
            &format!("width=\"{trace_width}\""),
            &format!("width=\"{output_width}\""),
            1,
        );
        svg = svg.replacen(
            &format!("height=\"{trace_height}\""),
            &format!("height=\"{output_height}\""),
            1,
        );

        if let Some(svg_start) = svg.find("<svg") {
            if let Some(relative_end) = svg[svg_start..].find('>') {
                let insert_at = svg_start + relative_end;
                let insert = format!(" viewBox=\"0 0 {trace_width} {trace_height}\"");
                svg.insert_str(insert_at, &insert);
            }
        }
    }

    svg.replacen("<svg ", "<svg aria-label=\"Vectorme vector trace\" ", 1)
}

pub fn analyze(svg: &str) -> (usize, Vec<String>) {
    let mut paths = 0usize;
    let mut colors = Vec::new();

    for line in svg.lines() {
        if !line.trim_start().starts_with("<path") {
            continue;
        }
        paths += 1;
        if let Some(start) = line.find("fill=\"#") {
            let rest = &line[start + 7..];
            if let Some(end) = rest.find('"') {
                let color = format!("#{}", &rest[..end]);
                if !colors.contains(&color) {
                    colors.push(color);
                }
            }
        }
    }

    colors.sort();
    (paths, colors)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn inserts_viewbox_after_svg_tag_not_xml_declaration() {
        let raw = r#"<?xml version="1.0" encoding="UTF-8"?><svg width="10" height="10"></svg>"#;
        let output = finalize(raw, 10, 10, 100, 100);

        assert!(output.contains("viewBox=\"0 0 10 10\""));
        assert!(output.contains("width=\"100\" height=\"100\""));
        assert!(!output.contains("UTF-8\" viewBox"));
    }

    #[test]
    fn analyzes_paths_and_unique_colors() {
        let svg = r##"<svg>
<path d="M0 0" fill="#ff0000"/>
<path d="M1 1" fill="#00ff00"/>
<path d="M2 2" fill="#ff0000"/>
</svg>"##;

        let (paths, colors) = analyze(svg);

        assert_eq!(paths, 3);
        assert_eq!(colors, vec!["#00ff00".to_string(), "#ff0000".to_string()]);
    }
}
