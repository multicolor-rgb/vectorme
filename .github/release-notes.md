# Vectorme 0.1.0

Vectorme is a local raster-to-SVG tracer for Linux and Windows. This first release
includes automatic color tracing, a node editor, a bilingual interface and native
installers for both platforms.

## Downloads

| Platform | Files |
| --- | --- |
| Windows 10/11 x64 | `.msi`, `-setup.exe` |
| Linux x86_64 | `.deb`, `.AppImage` |

Download the files below, or visit the
[project website](https://multicolor-rgb.github.io/vectorme/).

## Highlights

- PNG, JPEG, WebP, BMP, GIF and TIFF input.
- Color and black-and-white tracing with Logo, Black & White and Photo presets.
- Color precision, layer difference, corner sharpness, smoothing, speckle filter,
  path precision and maximum dimension controls.
- Before/after comparison with zoom and pan.
- Transparency preservation or flattening onto white.
- Node editor: select a path, drag anchors and Bezier handles, delete a point,
  smooth a point or the whole path, undo/redo.
- English by default; Polish in **Settings → Language** (`Ctrl+,`).
- 100% offline. No cloud, account or telemetry.

## Installation

**Windows:** run the `.msi` or `-setup.exe`. The build is unsigned, so SmartScreen
may show a warning; choose **More info → Run anyway** if you trust the build.
WebView2 is normally preinstalled on Windows 10/11.

**Linux (Debian/Ubuntu/Mint):**

```bash
sudo apt install ./Vectorme_0.1.0_amd64.deb
```

**Linux (AppImage):**

```bash
chmod +x Vectorme_0.1.0_amd64.AppImage
./Vectorme_0.1.0_amd64.AppImage
```

Without FUSE, use:

```bash
./Vectorme_0.1.0_amd64.AppImage --appimage-extract-and-run
```

SHA-256 checksums are attached as `SHA256SUMS.txt`.

---

# Vectorme 0.1.0 — polski

Vectorme to lokalny tracer rastrowy do SVG dla Linuksa i Windowsa. Pierwsze wydanie
zawiera automatyczną wektoryzację kolorową, edytor węzłów, dwujęzyczny interfejs oraz
natywne instalatory dla obu platform.

## Pobieranie

| Platforma | Pliki |
| --- | --- |
| Windows 10/11 x64 | `.msi`, `-setup.exe` |
| Linux x86_64 | `.deb`, `.AppImage` |

Pliki są dostępne poniżej, a także na
[stronie projektu](https://multicolor-rgb.github.io/vectorme/).

## Najważniejsze funkcje

- Wejście PNG, JPEG, WebP, BMP, GIF i TIFF.
- Wektoryzacja kolorowa i czarno-biała z presetami Logo, Black & White i Photo.
- Kontrola precyzji kolorów, różnicy warstw, ostrości narożników, wygładzania,
  filtra plamek, precyzji ścieżek i maksymalnego wymiaru.
- Porównanie przed/po z zoomem i panoramą.
- Zachowanie przezroczystości lub spłaszczenie na białym tle.
- Edytor węzłów: wybór ścieżki, przeciąganie punktów i uchwytów Béziera, usuwanie
  punktu, wygładzanie punktu lub całej ścieżki, undo/redo.
- Domyślnie angielski; polski w **Ustawienia → Język** (`Ctrl+,`).
- 100% offline. Bez chmury, konta i telemetrii.

## Instalacja

**Windows:** uruchom `.msi` lub `-setup.exe`. Build nie jest podpisany, więc
SmartScreen może pokazać ostrzeżenie; wybierz **Więcej informacji → Uruchom mimo to**,
jeśli ufasz buildowi. WebView2 jest zwykle zainstalowany w Windows 10/11.

**Linux (Debian/Ubuntu/Mint):**

```bash
sudo apt install ./Vectorme_0.1.0_amd64.deb
```

**Linux (AppImage):**

```bash
chmod +x Vectorme_0.1.0_amd64.AppImage
./Vectorme_0.1.0_amd64.AppImage
```

Bez FUSE:

```bash
./Vectorme_0.1.0_amd64.AppImage --appimage-extract-and-run
```

Sumy kontrolne SHA-256 są dołączone jako `SHA256SUMS.txt`.
