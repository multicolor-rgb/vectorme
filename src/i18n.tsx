import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { TraceWarning } from "./types";

export type Locale = "en" | "pl";

const en = {
  "app.name": "Vectorme",
  "app.tagline": "Raster → SVG, locally",
  "app.offline": "100% offline",

  "menu.file": "File",
  "menu.edit": "Edit",
  "menu.view": "View",
  "menu.help": "Help",
  "menu.main": "Main menu",
  "menu.open": "Open Image…",
  "menu.save": "Save SVG…",
  "menu.closeImage": "Close Image",
  "menu.quit": "Quit",
  "menu.trace": "Trace Image",
  "menu.settings": "Settings…",
  "menu.result": "Result",
  "menu.original": "Original",
  "menu.compare": "Compare",
  "menu.editNodes": "Edit Nodes",
  "menu.zoomIn": "Zoom In",
  "menu.zoomOut": "Zoom Out",
  "menu.fit": "Fit to Window",
  "menu.about": "About Vectorme",
  "menu.shortcuts": "Keyboard Shortcuts",

  "action.openImage": "Open Image",
  "action.trace": "Trace",
  "action.tracing": "Tracing…",
  "action.saveSvg": "Save SVG",
  "action.retrace": "Trace Again",
  "action.settings": "Settings",
  "action.reset": "Close Image",
  "action.close": "Close",

  "rail.open": "Open image",
  "rail.trace": "Trace image",
  "rail.compare": "Compare before and after",
  "rail.edit": "Edit nodes",
  "rail.result": "Show result",
  "rail.original": "Show original",
  "rail.fit": "Fit to window",
  "rail.zoomIn": "Zoom in",
  "rail.zoomOut": "Zoom out",
  "rail.settings": "Settings",
  "rail.tools": "Tools",

  "document.untitled": "Untitled",
  "document.preview": "Preview",

  "panel.properties": "Properties",
  "panel.presets": "Presets",
  "panel.output": "Output",

  "group.color": "Color",
  "group.shape": "Shape",
  "group.filters": "Filters & Size",
  "group.output": "Output",

  "preset.logo": "Logo",
  "preset.logoTagline": "Sharp edges, clean curves",
  "preset.bw": "Black & White",
  "preset.bwTagline": "Silhouettes, scans, icons",
  "preset.photo": "Photo",
  "preset.photoTagline": "Soft transitions, less noise",
  "preset.custom": "Custom",
  "presets.note": "Choose a starting point, then fine-tune colors and curves in Properties.",

  "control.colorMode": "Color mode",
  "control.color": "Color",
  "control.binary": "Black & White",
  "control.colorPrecision": "Color precision",
  "control.colorPrecisionHint": "Lower values produce smaller files with fewer tonal steps.",
  "control.layerDifference": "Layer difference",
  "control.layerDifferenceHint": "Threshold at which a new color layer begins.",
  "control.curveMode": "Curve style",
  "control.spline": "Smooth",
  "control.polygon": "Polygons",
  "control.cornerThreshold": "Corner sharpness",
  "control.cornerThresholdHint": "Higher values keep more sharp corners instead of arcs.",
  "control.lengthThreshold": "Minimum length",
  "control.lengthThresholdHint": "Shorter segments are simplified away.",
  "control.spliceThreshold": "Curve splicing",
  "control.maxIterations": "Fit iterations",
  "control.hierarchy": "Layers",
  "control.stacked": "Stacked",
  "control.cutout": "Cutout",
  "control.filterSpeckle": "Speckle filter",
  "control.filterSpeckleHint": "Removes tiny islands and noise.",
  "control.pathPrecision": "Path precision",
  "control.maxDimension": "Maximum dimension",
  "control.sizeFast": "1500 px — fast",
  "control.sizePhoto": "2500 px — photos",
  "control.sizeRecommended": "3000 px — recommended",
  "control.sizeDetail": "4000 px — detail",
  "control.sizeNone": "No limit — may be slow",
  "control.preserveTransparency": "Preserve transparency",
  "control.preserveTransparencyHint": "Turn off to flatten the image onto white.",
  "control.retrace": "Trace Again",

  "viewer.result": "Result",
  "viewer.original": "Original",
  "viewer.compare": "Compare",
  "viewer.edit": "Edit",
  "viewer.fit": "Fit",
  "viewer.zoomIn": "Zoom in",
  "viewer.zoomOut": "Zoom out",
  "viewer.svg": "SVG",
  "viewer.originalLabel": "Original",
  "viewer.loading": "Loading image…",
  "viewer.tracing": "Analyzing colors and fitting curves…",

  "edit.hintSelectPath": "Click a path to show its nodes",
  "edit.hintSelectPoint": "Select a node to edit it",
  "edit.pointSelected": "Point {index} selected",
  "edit.pathSelected": "Path {index} selected",
  "edit.deletePoint": "Delete Point",
  "edit.smoothPoint": "Smooth Point",
  "edit.smoothPath": "Smooth Path",
  "edit.undo": "Undo",
  "edit.redo": "Redo",
  "edit.done": "Done",
  "edit.minPoints": "A closed path needs at least 3 points.",
  "edit.hint": "Drag nodes or handles. Del removes the selected point.",
  "edit.noPaths": "No editable paths in this SVG.",

  "stats.paths": "paths",
  "stats.colors": "colors",
  "stats.svg": "SVG",
  "stats.source": "source",
  "stats.time": "time",
  "stats.palette": "Palette",
  "stats.empty": "Open an image and the result, statistics and palette will appear here.",
  "stats.warnings": "Warnings",
  "stats.edited": "edited",

  "status.ready": "Ready",
  "status.waiting": "Waiting for an image",
  "status.loading": "Loading image…",
  "status.tracing": "Analyzing colors and fitting curves…",
  "status.renderer": "Renderer: VTracer",
  "status.hint": "Ctrl+O open · Ctrl+Enter trace · Ctrl+S save",
  "status.zoom": "{value}%",
  "status.editing": "Editing nodes",

  "context.empty": "Open an image to start tracing",
  "context.ready": "Scroll to zoom · Drag to pan · Compare before and after",
  "context.result": "Result ready · Save it as SVG",
  "context.edit": "Select a path, then drag, delete or smooth its nodes · Alt-drag or middle-drag to pan",
  "context.loading": "Loading image…",
  "context.tracing": "Analyzing colors and fitting curves…",

  "empty.title": "Drop an image, leave with vectors",
  "empty.body": "Drag a file here or pick one from disk. Vectorme separates colors, fits curves and prepares a ready-to-use SVG.",
  "empty.open": "Choose Image",
  "empty.note": "Your image never leaves your computer. No cloud, no account, no telemetry.",
  "empty.drop": "Drop image",
  "empty.dropBody": "PNG, JPEG, WebP, BMP, GIF or TIFF",

  "toast.saved": "Saved SVG: {path}",
  "toast.unsupported": "Unsupported format. Choose PNG, JPEG, WebP, BMP, GIF or TIFF.",
  "toast.desktopOnly": "This feature requires the desktop app. Run `npm run tauri dev`.",
  "toast.engineUnavailable": "The browser preview has no tracing engine. Run the desktop app with `npm run tauri dev`.",
  "toast.saveDesktopOnly": "Saving works in the desktop app. Run `npm run tauri dev`.",
  "toast.noImage": "Open an image first.",

  "dialog.openTitle": "Choose an image to trace",
  "dialog.saveTitle": "Save result as SVG",
  "dialog.imageFilter": "Images",
  "dialog.svgFilter": "SVG vector graphics",

  "warning.downscaled": "Image was downscaled from {fromWidth}×{fromHeight} to {toWidth}×{toHeight} px for tracing.",
  "warning.softAlpha": "The image contains semi-transparent pixels. VTracer keeps full transparency, but soft edges may be simplified.",
  "warning.transparencyFlattened": "Transparency was replaced with a white background.",
  "warning.noPaths": "The engine found no paths. Try increasing color precision or disabling the speckle filter.",

  "error.fileNotFound": "File not found: {detail}",
  "error.unsupportedImage": "Unsupported or corrupted image: {detail}",
  "error.decode": "Failed to decode image: {detail}",
  "error.engine": "Vectorization failed: {detail}",
  "error.save": "Cannot save file: {detail}",
  "error.targetDirectory": "Target directory does not exist: {detail}",
  "error.taskCancelled": "Task was cancelled: {detail}",

  "settings.title": "Settings",
  "settings.general": "General",
  "settings.language": "Language",
  "settings.languageHint": "Choose the language used by the interface.",
  "settings.english": "English",
  "settings.englishHint": "Default language",
  "settings.polish": "Polski",
  "settings.polishHint": "Interfejs w języku polskim",
  "settings.appearance": "Appearance",
  "settings.theme": "Theme",
  "settings.themeDark": "Dark",
  "settings.themeHint": "Vectorme currently uses the ArtCraft-inspired dark workspace.",
  "settings.about": "About",
  "settings.version": "Version",
  "settings.engine": "Tracing engine",
  "settings.license": "License",
  "settings.done": "Done",

  "shortcuts.title": "Keyboard Shortcuts",
  "shortcuts.open": "Open image",
  "shortcuts.save": "Save SVG",
  "shortcuts.trace": "Trace image",
  "shortcuts.settings": "Open settings",
  "shortcuts.zoomIn": "Zoom in",
  "shortcuts.zoomOut": "Zoom out",
  "shortcuts.fit": "Fit to window",
  "shortcuts.close": "Close dialog",

  "about.title": "About Vectorme",
  "about.body": "A local raster-to-SVG tracer for Linux, built with Tauri, Rust and VTracer.",
  "about.version": "Version 0.1.0",
  "about.engine": "Engine: VTracer 0.6.5 · MIT / Apache-2.0",
  "about.license": "Vectorme is released under the MIT license.",
} as const;

export type TranslationKey = keyof typeof en;

const pl: Record<TranslationKey, string> = {
  "app.name": "Vectorme",
  "app.tagline": "Raster → SVG, lokalnie",
  "app.offline": "100% offline",

  "menu.file": "Plik",
  "menu.edit": "Edycja",
  "menu.view": "Widok",
  "menu.help": "Pomoc",
  "menu.main": "Menu główne",
  "menu.open": "Otwórz obraz…",
  "menu.save": "Zapisz SVG…",
  "menu.closeImage": "Zamknij obraz",
  "menu.quit": "Zakończ",
  "menu.trace": "Wektoryzuj obraz",
  "menu.settings": "Ustawienia…",
  "menu.result": "Wynik",
  "menu.original": "Oryginał",
  "menu.compare": "Porównanie",
  "menu.editNodes": "Edytuj punkty",
  "menu.zoomIn": "Powiększ",
  "menu.zoomOut": "Pomniejsz",
  "menu.fit": "Dopasuj do okna",
  "menu.about": "O Vectorme",
  "menu.shortcuts": "Skróty klawiszowe",

  "action.openImage": "Otwórz obraz",
  "action.trace": "Wektoryzuj",
  "action.tracing": "Wektoryzuję…",
  "action.saveSvg": "Zapisz SVG",
  "action.retrace": "Wektoryzuj ponownie",
  "action.settings": "Ustawienia",
  "action.reset": "Zamknij obraz",
  "action.close": "Zamknij",

  "rail.open": "Otwórz obraz",
  "rail.trace": "Wektoryzuj obraz",
  "rail.compare": "Porównaj przed i po",
  "rail.edit": "Edytuj punkty",
  "rail.result": "Pokaż wynik",
  "rail.original": "Pokaż oryginał",
  "rail.fit": "Dopasuj do okna",
  "rail.zoomIn": "Powiększ",
  "rail.zoomOut": "Pomniejsz",
  "rail.settings": "Ustawienia",
  "rail.tools": "Narzędzia",

  "document.untitled": "Bez nazwy",
  "document.preview": "Podgląd",

  "panel.properties": "Właściwości",
  "panel.presets": "Presety",
  "panel.output": "Wynik",

  "group.color": "Kolor",
  "group.shape": "Kształt",
  "group.filters": "Filtry i rozmiar",
  "group.output": "Wynik",

  "preset.logo": "Logo",
  "preset.logoTagline": "Ostre krawędzie, czyste krzywe",
  "preset.bw": "Czarno-biały",
  "preset.bwTagline": "Sylwetki, skany, ikony",
  "preset.photo": "Zdjęcie",
  "preset.photoTagline": "Miękkie przejścia, mniej szumu",
  "preset.custom": "Własne",
  "presets.note": "Wybierz punkt wyjścia, a potem dopasuj kolory i krzywe w Właściwościach.",

  "control.colorMode": "Tryb kolorów",
  "control.color": "Kolor",
  "control.binary": "Czarno-biały",
  "control.colorPrecision": "Precyzja kolorów",
  "control.colorPrecisionHint": "Mniej = mniejszy plik i mniej przejść tonalnych.",
  "control.layerDifference": "Różnica warstw",
  "control.layerDifferenceHint": "Próg, od którego powstaje nowa warstwa koloru.",
  "control.curveMode": "Rodzaj krzywych",
  "control.spline": "Gładkie",
  "control.polygon": "Wielokąty",
  "control.cornerThreshold": "Ostrość narożników",
  "control.cornerThresholdHint": "Wyżej = więcej kątów prostych zamiast łuków.",
  "control.lengthThreshold": "Minimalna długość",
  "control.lengthThresholdHint": "Krótsze segmenty są upraszczane.",
  "control.spliceThreshold": "Łączenie krzywych",
  "control.maxIterations": "Iteracje dopasowania",
  "control.hierarchy": "Warstwy",
  "control.stacked": "Nakładane",
  "control.cutout": "Wycinane",
  "control.filterSpeckle": "Filtr plamek",
  "control.filterSpeckleHint": "Usuwa drobne wysepki i szum.",
  "control.pathPrecision": "Precyzja ścieżek",
  "control.maxDimension": "Maksymalny wymiar",
  "control.sizeFast": "1500 px — szybko",
  "control.sizePhoto": "2500 px — zdjęcia",
  "control.sizeRecommended": "3000 px — zalecane",
  "control.sizeDetail": "4000 px — detal",
  "control.sizeNone": "Bez limitu — może być wolno",
  "control.preserveTransparency": "Zachowaj przezroczystość",
  "control.preserveTransparencyHint": "Wyłącz, aby położyć obraz na białym tle.",
  "control.retrace": "Wektoryzuj ponownie",

  "viewer.result": "Wynik",
  "viewer.original": "Oryginał",
  "viewer.compare": "Porównanie",
  "viewer.edit": "Edytuj",
  "viewer.fit": "Dopasuj",
  "viewer.zoomIn": "Powiększ",
  "viewer.zoomOut": "Pomniejsz",
  "viewer.svg": "SVG",
  "viewer.originalLabel": "Oryginał",
  "viewer.loading": "Wczytuję obraz…",
  "viewer.tracing": "Analizuję kolory i dopasowuję krzywe…",

  "edit.hintSelectPath": "Kliknij ścieżkę, aby pokazać punkty",
  "edit.hintSelectPoint": "Wybierz punkt, aby go edytować",
  "edit.pointSelected": "Wybrano punkt {index}",
  "edit.pathSelected": "Wybrano ścieżkę {index}",
  "edit.deletePoint": "Usuń punkt",
  "edit.smoothPoint": "Wygładź punkt",
  "edit.smoothPath": "Wygładź ścieżkę",
  "edit.undo": "Cofnij",
  "edit.redo": "Ponów",
  "edit.done": "Gotowe",
  "edit.minPoints": "Zamknięta ścieżka wymaga co najmniej 3 punktów.",
  "edit.hint": "Przeciągaj punkty lub uchwyty. Del usuwa wybrany punkt.",
  "edit.noPaths": "Brak edytowalnych ścieżek w tym SVG.",

  "stats.paths": "ścieżek",
  "stats.colors": "kolorów",
  "stats.svg": "SVG",
  "stats.source": "źródło",
  "stats.time": "czas",
  "stats.palette": "Paleta",
  "stats.empty": "Wczytaj obraz, a wynik pojawi się tutaj wraz ze statystykami i paletą kolorów.",
  "stats.warnings": "Ostrzeżenia",
  "stats.edited": "zmodyfikowany",

  "status.ready": "Gotowe",
  "status.waiting": "Czekam na obraz",
  "status.loading": "Wczytuję obraz…",
  "status.tracing": "Analizuję kolory i dopasowuję krzywe…",
  "status.renderer": "Silnik: VTracer",
  "status.hint": "Ctrl+O otwórz · Ctrl+Enter wektoryzuj · Ctrl+S zapisz",
  "status.zoom": "{value}%",
  "status.editing": "Edycja punktów",

  "context.empty": "Otwórz obraz, aby rozpocząć wektoryzację",
  "context.ready": "Kółko myszy = zoom · Przeciąganie = panorama · Porównaj przed i po",
  "context.result": "Wynik gotowy · Zapisz go jako SVG",
  "context.edit": "Wybierz ścieżkę, a potem przeciągaj, usuwaj lub wygładzaj jej punkty · Alt+przeciąganie lub środkowy przycisk = panorama",
  "context.loading": "Wczytuję obraz…",
  "context.tracing": "Analizuję kolory i dopasowuję krzywe…",

  "empty.title": "Wrzuć obraz, wyjdź z wektorami",
  "empty.body": "Przeciągnij plik tutaj albo wybierz go z dysku. Vectorme sam rozdzieli kolory, dopasuje krzywe i przygotuje gotowy plik SVG.",
  "empty.open": "Wybierz obraz",
  "empty.note": "Obraz nie opuszcza Twojego komputera. Bez chmury, bez konta, bez telemetrii.",
  "empty.drop": "Upuść obraz",
  "empty.dropBody": "PNG, JPEG, WebP, BMP, GIF lub TIFF",

  "toast.saved": "Zapisano SVG: {path}",
  "toast.unsupported": "Nieobsługiwany format. Wybierz PNG, JPEG, WebP, BMP, GIF lub TIFF.",
  "toast.desktopOnly": "Ta funkcja działa w aplikacji desktopowej. Uruchom `npm run tauri dev`.",
  "toast.engineUnavailable": "Podgląd w przeglądarce nie ma silnika wektoryzacji. Uruchom `npm run tauri dev`.",
  "toast.saveDesktopOnly": "Zapis działa w aplikacji desktopowej. Uruchom `npm run tauri dev`.",
  "toast.noImage": "Najpierw otwórz obraz.",

  "dialog.openTitle": "Wybierz obraz do wektoryzacji",
  "dialog.saveTitle": "Zapisz wynik jako SVG",
  "dialog.imageFilter": "Obrazy",
  "dialog.svgFilter": "Grafika wektorowa SVG",

  "warning.downscaled": "Obraz zmniejszono z {fromWidth}×{fromHeight} do {toWidth}×{toHeight} px na potrzeby wektoryzacji.",
  "warning.softAlpha": "Obraz zawiera półprzezroczyste piksele. VTracer zachowuje pełną przezroczystość, ale miękkie krawędzie mogą zostać uproszczone.",
  "warning.transparencyFlattened": "Przezroczystość została zastąpiona białym tłem.",
  "warning.noPaths": "Silnik nie znalazł żadnych ścieżek. Spróbuj zwiększyć precyzję kolorów lub wyłączyć filtr plamek.",

  "error.fileNotFound": "Nie znaleziono pliku: {detail}",
  "error.unsupportedImage": "Nieobsługiwany lub uszkodzony obraz: {detail}",
  "error.decode": "Nie udało się odczytać obrazu: {detail}",
  "error.engine": "Błąd wektoryzacji: {detail}",
  "error.save": "Nie można zapisać pliku: {detail}",
  "error.targetDirectory": "Katalog docelowy nie istnieje: {detail}",
  "error.taskCancelled": "Zadanie zostało przerwane: {detail}",

  "settings.title": "Ustawienia",
  "settings.general": "Ogólne",
  "settings.language": "Język",
  "settings.languageHint": "Wybierz język interfejsu.",
  "settings.english": "English",
  "settings.englishHint": "Język domyślny",
  "settings.polish": "Polski",
  "settings.polishHint": "Interfejs w języku polskim",
  "settings.appearance": "Wygląd",
  "settings.theme": "Motyw",
  "settings.themeDark": "Ciemny",
  "settings.themeHint": "Vectorme korzysta obecnie z ciemnego obszaru roboczego inspirowanego ArtCraft.",
  "settings.about": "O programie",
  "settings.version": "Wersja",
  "settings.engine": "Silnik wektoryzacji",
  "settings.license": "Licencja",
  "settings.done": "Gotowe",

  "shortcuts.title": "Skróty klawiszowe",
  "shortcuts.open": "Otwórz obraz",
  "shortcuts.save": "Zapisz SVG",
  "shortcuts.trace": "Wektoryzuj obraz",
  "shortcuts.settings": "Otwórz ustawienia",
  "shortcuts.zoomIn": "Powiększ",
  "shortcuts.zoomOut": "Pomniejsz",
  "shortcuts.fit": "Dopasuj do okna",
  "shortcuts.close": "Zamknij okno",

  "about.title": "O Vectorme",
  "about.body": "Lokalny tracer raster-to-SVG dla Linuksa, zbudowany z Tauri, Rusta i VTracer.",
  "about.version": "Wersja 0.1.0",
  "about.engine": "Silnik: VTracer 0.6.5 · MIT / Apache-2.0",
  "about.license": "Vectorme jest dostępny na licencji MIT.",
};

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { en, pl };

export type TFunction = (key: TranslationKey, vars?: Record<string, string | number>) => string;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFunction;
}

const I18nContext = createContext<I18nContextValue | null>(null);
const STORAGE_KEY = "vectorme.locale";

function loadLocale(): Locale {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "pl" ? "pl" : "en";
  } catch {
    return "en";
  }
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(loadLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = locale === "pl" ? "Vectorme — raster do SVG" : "Vectorme — raster to SVG";
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Storage can be unavailable in hardened environments; the UI still works.
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next === "pl" ? "pl" : "en");
  }, []);

  const t = useCallback<TFunction>(
    (key, vars) => interpolate(dictionaries[locale][key] ?? en[key] ?? key, vars),
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
}

export function warningMessage(warning: TraceWarning, t: TFunction): string {
  switch (warning.code) {
    case "downscaled":
      return t("warning.downscaled", {
        fromWidth: warning.fromWidth,
        fromHeight: warning.fromHeight,
        toWidth: warning.toWidth,
        toHeight: warning.toHeight,
      });
    case "softAlpha":
      return t("warning.softAlpha");
    case "transparencyFlattened":
      return t("warning.transparencyFlattened");
    case "noPaths":
      return t("warning.noPaths");
  }
}

const errorPrefixes: Array<[string, TranslationKey]> = [
  ["File not found: ", "error.fileNotFound"],
  ["Unsupported or corrupted image: ", "error.unsupportedImage"],
  ["Failed to decode image: ", "error.decode"],
  ["Vectorization failed: ", "error.engine"],
  ["Cannot save file ", "error.save"],
  ["Target directory does not exist: ", "error.targetDirectory"],
  ["Task was cancelled: ", "error.taskCancelled"],
];

export function localizeError(message: string, t: TFunction): string {
  for (const [prefix, key] of errorPrefixes) {
    if (message.startsWith(prefix)) {
      return t(key, { detail: message.slice(prefix.length) });
    }
  }
  return message;
}
