import JSZip from "jszip";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const TAGS = {
  0x010f: "Make",
  0x0110: "Model",
  0x8769: "ExifIFDPointer",
  0x829a: "ExposureTime",
  0x829d: "FNumber",
  0x8827: "ISO",
  0x920a: "FocalLength",
  0xa434: "LensModel",
};

const ICONS = {
  none: "none",
  instagram: "instagram",
  telegram: "telegram",
  camera: "camera",
};

const ASPECT_RATIOS = [
  { value: "1:1", labelKey: "ratioSquare", width: 1, height: 1 },
  { value: "4:5", labelKey: "ratioPortrait", width: 4, height: 5 },
  { value: "5:4", labelKey: "ratioLandscape", width: 5, height: 4 },
  { value: "3:2", labelKey: "ratioPhoto", width: 3, height: 2 },
  { value: "2:3", labelKey: "ratioVerticalPhoto", width: 2, height: 3 },
  { value: "4:3", labelKey: "ratioClassic", width: 4, height: 3 },
  { value: "3:4", labelKey: "ratioClassicPortrait", width: 3, height: 4 },
  { value: "16:9", labelKey: "ratioWide", width: 16, height: 9 },
  { value: "9:16", labelKey: "ratioStories", width: 9, height: 16 },
  { value: "21:9", labelKey: "ratioPanorama", width: 21, height: 9 },
];

const FRAME_STYLES = [
  { value: "ambient", labelKey: "frameStyleAmbient" },
  { value: "whiteBottom", labelKey: "frameStyleWhiteBottom" },
];

const CAMERA_BRAND_LOGOS = {
  canon: "/camera_brands/canon.png",
  fujifilm: "/camera_brands/fujifilm.png",
  nikon: "/camera_brands/nikon.png",
  panasonic: "/camera_brands/panasonic.png",
  sony: "/camera_brands/sony.png",
};

const CAMERA_BRAND_LOGO_SCALE = {
  nikon: 1.55,
};

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ru", label: "Русский" },
  { value: "pt", label: "Português" },
];

const TRANSLATIONS = {
  en: {
    appTitle: "Batch Frame",
    appDescription: "Upload a photo series, tune the selected frame individually, or copy the current frame settings across the full set.",
    language: "Language",
    loading: "Loading...",
    addPhotos: "Add photos",
    photosInSet: (count) => `${count} ${count === 1 ? "photo" : "photos"} in the set`,
    uploadNote: "You can select multiple files at once",
    noSupportedImages: "The selected files do not include any supported images.",
    added: (count) => `Added: ${count}`,
    skipped: (count) => `Skipped non-images: ${count}`,
    failed: (count) => `Failed to open: ${count}`,
    applyToAll: "Apply to all",
    saving: "Saving...",
    saveFrame: "Save frame",
    buildingZip: "Building ZIP...",
    saveZipBatch: "Save ZIP batch",
    selectedFrame: "Selected Frame",
    of: "of",
    addPhotosToSetUp: "Add photos to set up a frame.",
    selectedFrameSettings: "Selected frame settings",
    frameSettings: "Frame Settings",
    show: "Show",
    hide: "Hide",
    format: "Format",
    frameStyle: "Frame style",
    frameStyleAmbient: "Ambient dark frame",
    frameStyleWhiteBottom: "OneLine",
    customRatio: "Custom ratio",
    width: "Width",
    height: "Height",
    caption: "Caption",
    horizontalCaption: "Horizontal at the bottom",
    verticalCaption: "Vertical on the right",
    crop: "Crop",
    decreaseCrop: "Decrease crop",
    increaseCrop: "Increase crop",
    reset: "Reset",
    exportSize: "Export size",
    framePadding: "Frame padding",
    bottomCaption: "Bottom caption",
    photoCornerRadius: "Photo corner radius",
    brandColor: "Brand color",
    lensInformation: "Lens information",
    watermarks: "Watermarks",
    add: "Add",
    remove: "Remove",
    watermarkCaption: "Caption",
    text: "Text",
    icon: "Icon",
    size: "Size",
    opacity: "Opacity",
    lineOffset: "Line offset",
    captionData: "Caption Data",
    edit: "Edit",
    done: "Done",
    make: "Make",
    model: "Model",
    lens: "Lens",
    focal: "Focal",
    aperture: "Aperture",
    shutter: "Shutter",
    camera: "Camera",
    settings: "Settings",
    noExifData: "No EXIF data found.",
    createdBy: "Created by",
    preview: "Preview",
    emptyPreview: "The selected photo preview will appear here.",
    cropScale: "Crop scale",
    cropZoom: "Crop zoom",
    zoomOut: "Zoom out",
    zoomIn: "Zoom in",
    filmstrip: "Filmstrip",
    filmstripCount: (count) => `${count} ${count === 1 ? "photo" : "photos"}`,
    clear: "Clear",
    framesAfterUpload: "Frames will appear here after upload.",
    removePhoto: (name) => `Remove ${name}`,
    ratioSquare: "1:1, square",
    ratioPortrait: "4:5, portrait",
    ratioLandscape: "5:4, landscape",
    ratioPhoto: "3:2, photo",
    ratioVerticalPhoto: "2:3, vertical photo",
    ratioClassic: "4:3, classic",
    ratioClassicPortrait: "3:4, classic portrait",
    ratioWide: "16:9, wide",
    ratioStories: "9:16, stories",
    ratioPanorama: "21:9, panorama",
    iconNone: "No icon",
    iconInstagram: "Instagram",
    iconTelegram: "Telegram",
    iconCamera: "Camera",
  },
  ru: {
    appTitle: "Пакетная рамка",
    appDescription: "Загрузите серию фото, настройте выбранный кадр отдельно или примените текущие настройки ко всему набору.",
    language: "Язык",
    loading: "Загрузка...",
    addPhotos: "Добавить фото",
    photosInSet: (count) => `${count} фото в наборе`,
    uploadNote: "Можно выбрать несколько файлов сразу",
    noSupportedImages: "В выбранных файлах нет поддерживаемых изображений.",
    added: (count) => `Добавлено: ${count}`,
    skipped: (count) => `Пропущено не изображений: ${count}`,
    failed: (count) => `Не удалось открыть: ${count}`,
    applyToAll: "Применить ко всем",
    saving: "Сохранение...",
    saveFrame: "Сохранить кадр",
    buildingZip: "Сборка ZIP...",
    saveZipBatch: "Сохранить ZIP",
    selectedFrame: "Выбранный кадр",
    of: "из",
    addPhotosToSetUp: "Добавьте фото, чтобы настроить рамку.",
    selectedFrameSettings: "Настройки выбранного кадра",
    frameSettings: "Настройки рамки",
    show: "Показать",
    hide: "Скрыть",
    format: "Формат",
    frameStyle: "Стиль рамки",
    frameStyleAmbient: "Темная рамка",
    frameStyleWhiteBottom: "OneLine",
    customRatio: "Свой формат",
    width: "Ширина",
    height: "Высота",
    caption: "Подпись",
    horizontalCaption: "Горизонтально снизу",
    verticalCaption: "Вертикально справа",
    crop: "Кадрирование",
    decreaseCrop: "Уменьшить кадрирование",
    increaseCrop: "Увеличить кадрирование",
    reset: "Сбросить",
    exportSize: "Размер экспорта",
    framePadding: "Отступ рамки",
    bottomCaption: "Нижняя подпись",
    photoCornerRadius: "Скругление фото",
    brandColor: "Цвет бренда",
    lensInformation: "Информация об объективе",
    watermarks: "Водяные знаки",
    add: "Добавить",
    remove: "Удалить",
    watermarkCaption: "Подпись",
    text: "Текст",
    icon: "Иконка",
    size: "Размер",
    opacity: "Прозрачность",
    lineOffset: "Отступ строки",
    captionData: "Данные подписи",
    edit: "Изменить",
    done: "Готово",
    make: "Бренд",
    model: "Модель",
    lens: "Объектив",
    focal: "Фокусное",
    aperture: "Диафрагма",
    shutter: "Выдержка",
    camera: "Камера",
    settings: "Параметры",
    noExifData: "EXIF-данные не найдены.",
    createdBy: "Создано",
    preview: "Предпросмотр",
    emptyPreview: "Предпросмотр выбранного фото появится здесь.",
    cropScale: "Масштаб кадрирования",
    cropZoom: "Зум кадрирования",
    zoomOut: "Отдалить",
    zoomIn: "Приблизить",
    filmstrip: "Лента кадров",
    filmstripCount: (count) => `${count} фото`,
    clear: "Очистить",
    framesAfterUpload: "Кадры появятся здесь после загрузки.",
    removePhoto: (name) => `Удалить ${name}`,
    ratioSquare: "1:1, квадрат",
    ratioPortrait: "4:5, портрет",
    ratioLandscape: "5:4, альбомный",
    ratioPhoto: "3:2, фото",
    ratioVerticalPhoto: "2:3, вертикальное фото",
    ratioClassic: "4:3, классический",
    ratioClassicPortrait: "3:4, классический портрет",
    ratioWide: "16:9, широкий",
    ratioStories: "9:16, сторис",
    ratioPanorama: "21:9, панорама",
    iconNone: "Без иконки",
    iconInstagram: "Instagram",
    iconTelegram: "Telegram",
    iconCamera: "Камера",
  },
  pt: {
    appTitle: "Moldura em lote",
    appDescription: "Envie uma série de fotos, ajuste o quadro selecionado individualmente ou copie as configurações atuais para todo o conjunto.",
    language: "Idioma",
    loading: "Carregando...",
    addPhotos: "Adicionar fotos",
    photosInSet: (count) => `${count} ${count === 1 ? "foto" : "fotos"} no conjunto`,
    uploadNote: "Voce pode selecionar varios arquivos de uma vez",
    noSupportedImages: "Os arquivos selecionados nao incluem imagens compatíveis.",
    added: (count) => `Adicionadas: ${count}`,
    skipped: (count) => `Ignorados nao imagens: ${count}`,
    failed: (count) => `Falha ao abrir: ${count}`,
    applyToAll: "Aplicar a todos",
    saving: "Salvando...",
    saveFrame: "Salvar quadro",
    buildingZip: "Gerando ZIP...",
    saveZipBatch: "Salvar ZIP",
    selectedFrame: "Quadro selecionado",
    of: "de",
    addPhotosToSetUp: "Adicione fotos para configurar a moldura.",
    selectedFrameSettings: "Configuracoes do quadro selecionado",
    frameSettings: "Configuracoes da moldura",
    show: "Mostrar",
    hide: "Ocultar",
    format: "Formato",
    frameStyle: "Estilo da moldura",
    frameStyleAmbient: "Moldura escura",
    frameStyleWhiteBottom: "OneLine",
    customRatio: "Proporcao personalizada",
    width: "Largura",
    height: "Altura",
    caption: "Legenda",
    horizontalCaption: "Horizontal na parte inferior",
    verticalCaption: "Vertical a direita",
    crop: "Corte",
    decreaseCrop: "Diminuir corte",
    increaseCrop: "Aumentar corte",
    reset: "Redefinir",
    exportSize: "Tamanho da exportacao",
    framePadding: "Margem da moldura",
    bottomCaption: "Legenda inferior",
    photoCornerRadius: "Raio dos cantos da foto",
    brandColor: "Cor da marca",
    lensInformation: "Informacao da lente",
    watermarks: "Marcas d'agua",
    add: "Adicionar",
    remove: "Remover",
    watermarkCaption: "Legenda",
    text: "Texto",
    icon: "Icone",
    size: "Tamanho",
    opacity: "Opacidade",
    lineOffset: "Espacamento da linha",
    captionData: "Dados da legenda",
    edit: "Editar",
    done: "Concluir",
    make: "Marca",
    model: "Modelo",
    lens: "Lente",
    focal: "Distancia focal",
    aperture: "Abertura",
    shutter: "Obturador",
    camera: "Camera",
    settings: "Configuracoes",
    noExifData: "Nenhum dado EXIF encontrado.",
    createdBy: "Criado por",
    preview: "Pre-visualizacao",
    emptyPreview: "A pre-visualizacao da foto selecionada aparecera aqui.",
    cropScale: "Escala do corte",
    cropZoom: "Zoom do corte",
    zoomOut: "Diminuir zoom",
    zoomIn: "Aumentar zoom",
    filmstrip: "Tira de fotos",
    filmstripCount: (count) => `${count} ${count === 1 ? "foto" : "fotos"}`,
    clear: "Limpar",
    framesAfterUpload: "Os quadros aparecerao aqui apos o envio.",
    removePhoto: (name) => `Remover ${name}`,
    ratioSquare: "1:1, quadrado",
    ratioPortrait: "4:5, retrato",
    ratioLandscape: "5:4, paisagem",
    ratioPhoto: "3:2, foto",
    ratioVerticalPhoto: "2:3, foto vertical",
    ratioClassic: "4:3, classico",
    ratioClassicPortrait: "3:4, retrato classico",
    ratioWide: "16:9, amplo",
    ratioStories: "9:16, stories",
    ratioPanorama: "21:9, panorama",
    iconNone: "Sem icone",
    iconInstagram: "Instagram",
    iconTelegram: "Telegram",
    iconCamera: "Camera",
  },
};

const isImageFile = (file) => file.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(file.name);

const createId = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

const newWatermark = () => ({
  id: createId(),
  text: "",
  icon: "instagram",
  size: 20,
  opacity: 0.55,
  x: 14,
  y: 32,
  lineOffset: 34,
});

const createDefaultSettings = () => ({
  ratio: "1:1",
  customRatioW: 4,
  customRatioH: 5,
  frameStyle: "ambient",
  captionOrientation: "horizontal",
  cropZoom: 1,
  cropX: 0,
  cropY: 0,
  photoRadius: 12,
  framePadding: 76,
  bottomArea: 104,
  brandColor: "#d51f1f",
  outputSize: 1600,
  showLensInfo: false,
  watermarks: [],
});

function cloneSettings(settings) {
  const defaultSettings = createDefaultSettings();
  return {
    ...defaultSettings,
    ...settings,
    watermarks: (settings.watermarks || defaultSettings.watermarks).map((item) => ({ ...item, id: createId() })),
  };
}

function readAscii(view, offset, length) {
  let value = "";
  for (let i = 0; i < length; i++) {
    const char = view.getUint8(offset + i);
    if (char === 0) break;
    value += String.fromCharCode(char);
  }
  return value.trim();
}

function readValue(view, tiffStart, entryOffset, littleEndian) {
  const type = view.getUint16(entryOffset + 2, littleEndian);
  const count = view.getUint32(entryOffset + 4, littleEndian);
  const valueOffset = entryOffset + 8;
  const typeSizes = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
  const totalBytes = (typeSizes[type] || 0) * count;
  const dataOffset = totalBytes <= 4 ? valueOffset : tiffStart + view.getUint32(valueOffset, littleEndian);

  if (type === 2) return readAscii(view, dataOffset, count);
  if (type === 3) return count === 1 ? view.getUint16(dataOffset, littleEndian) : Array.from({ length: count }, (_, i) => view.getUint16(dataOffset + i * 2, littleEndian));
  if (type === 4) return count === 1 ? view.getUint32(dataOffset, littleEndian) : Array.from({ length: count }, (_, i) => view.getUint32(dataOffset + i * 4, littleEndian));
  if (type === 5) {
    const numerator = view.getUint32(dataOffset, littleEndian);
    const denominator = view.getUint32(dataOffset + 4, littleEndian) || 1;
    return numerator / denominator;
  }
  if (type === 9) return view.getInt32(dataOffset, littleEndian);
  if (type === 10) {
    const numerator = view.getInt32(dataOffset, littleEndian);
    const denominator = view.getInt32(dataOffset + 4, littleEndian) || 1;
    return numerator / denominator;
  }
  return null;
}

function parseIFD(view, tiffStart, ifdOffset, littleEndian) {
  const result = {};
  const absoluteOffset = tiffStart + ifdOffset;
  if (absoluteOffset < 0 || absoluteOffset + 2 >= view.byteLength) return result;

  const entries = view.getUint16(absoluteOffset, littleEndian);
  for (let i = 0; i < entries; i++) {
    const entryOffset = absoluteOffset + 2 + i * 12;
    if (entryOffset + 12 > view.byteLength) break;
    const tag = view.getUint16(entryOffset, littleEndian);
    const name = TAGS[tag];
    if (name) result[name] = readValue(view, tiffStart, entryOffset, littleEndian);
  }
  return result;
}

function parseExif(buffer) {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return {};

  let offset = 2;
  while (offset < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);
    const length = view.getUint16(offset + 2);

    if (marker === 0xe1) {
      const exifHeader = readAscii(view, offset + 4, 6);
      if (!exifHeader.startsWith("Exif")) break;

      const tiffStart = offset + 10;
      const endian = readAscii(view, tiffStart, 2);
      const littleEndian = endian === "II";
      const firstIFDOffset = view.getUint32(tiffStart + 4, littleEndian);
      const main = parseIFD(view, tiffStart, firstIFDOffset, littleEndian);
      const exif = main.ExifIFDPointer ? parseIFD(view, tiffStart, main.ExifIFDPointer, littleEndian) : {};
      return { ...main, ...exif };
    }

    offset += 2 + length;
  }
  return {};
}

function formatShutter(value) {
  if (!value) return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value).trim();
  if (numeric >= 1) return `${Math.round(numeric * 10) / 10}s`;
  return `1/${Math.round(1 / numeric)}s`;
}

function formatAperture(value) {
  if (!value) return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value).trim();
  const rounded = Math.round(numeric * 10) / 10;
  return `F${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded}`;
}

function formatFocal(value) {
  if (!value) return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value).trim();
  return `${Math.round(numeric)}mm`;
}

function normalizeMake(make) {
  const value = String(make || "").trim();
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function normalizeBrandToken(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getCameraBrandKey(make) {
  const token = normalizeBrandToken(make);
  if (!token) return "";
  if (token.includes("canon")) return "canon";
  if (token.includes("fujifilm") || token.includes("fuji")) return "fujifilm";
  if (token.includes("nikon")) return "nikon";
  if (token.includes("panasonic") || token.includes("lumix")) return "panasonic";
  if (token.includes("sony")) return "sony";
  return CAMERA_BRAND_LOGOS[token] ? token : "";
}

function cleanModel(make, model) {
  const rawModel = String(model || "").trim();
  const rawMake = String(make || "").trim();
  if (!rawMake) return rawModel;
  const regex = new RegExp(`^${rawMake.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i");
  return rawModel.replace(regex, "").trim() || rawModel;
}

function getDisplay(exif) {
  const make = normalizeMake(exif.Make);
  const model = cleanModel(exif.Make, exif.Model);
  return {
    make,
    brandKey: getCameraBrandKey(exif.Make),
    model,
    lens: String(exif.LensModel || "").trim(),
    focal: formatFocal(exif.FocalLength),
    aperture: formatAperture(exif.FNumber),
    shutter: formatShutter(exif.ExposureTime),
    iso: exif.ISO || "",
  };
}

function fitRect(srcW, srcH, boxW, boxH, mode = "contain") {
  const scale = mode === "cover" ? Math.max(boxW / srcW, boxH / srcH) : Math.min(boxW / srcW, boxH / srcH);
  const w = srcW * scale;
  const h = srcH * scale;
  return { x: (boxW - w) / 2, y: (boxH - h) / 2, w, h, scale };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function resolveAspectRatio(settings) {
  if (settings.ratio === "custom") {
    return [
      clamp(Number(settings.customRatioW) || 1, 1, 99),
      clamp(Number(settings.customRatioH) || 1, 1, 99),
    ];
  }

  const preset = ASPECT_RATIOS.find((item) => item.value === settings.ratio) || ASPECT_RATIOS[0];
  return [preset.width, preset.height];
}

function getRatioLabel(settings) {
  if (settings.ratio === "custom") {
    return `${clamp(Number(settings.customRatioW) || 1, 1, 99)}:${clamp(Number(settings.customRatioH) || 1, 1, 99)}`;
  }
  return settings.ratio;
}

function coverRectWithCrop(srcW, srcH, boxW, boxH, zoom = 1, cropX = 0, cropY = 0) {
  const base = fitRect(srcW, srcH, boxW, boxH, "cover");
  const cropZoom = clamp(Number(zoom) || 1, 1, 3);
  const w = base.w * cropZoom;
  const h = base.h * cropZoom;
  const maxOffsetX = Math.max(0, (w - boxW) / 2);
  const maxOffsetY = Math.max(0, (h - boxH) / 2);
  const x = clamp((boxW - w) / 2 + (clamp(cropX, -100, 100) / 100) * maxOffsetX, boxW - w, 0);
  const y = clamp((boxH - h) / 2 + (clamp(cropY, -100, 100) / 100) * maxOffsetY, boxH - h, 0);

  return { x, y, w, h };
}

function getFrameLayout(settings) {
  const [rw, rh] = resolveAspectRatio(settings);
  const canvasW = settings.outputSize;
  const canvasH = Math.round((settings.outputSize * rh) / rw);
  const scale = canvasW / 1600;
  const isWhiteBottom = (settings.frameStyle || "ambient") === "whiteBottom";
  const hasVerticalCaption = !isWhiteBottom && settings.captionOrientation === "vertical";
  const padding = isWhiteBottom ? 0 : settings.framePadding * scale;
  const captionArea = settings.bottomArea * scale;
  const photoX = padding;
  const photoY = padding;
  const photoW = Math.max(1, canvasW - padding * 2 - (hasVerticalCaption ? captionArea : 0));
  const photoH = Math.max(1, canvasH - padding * 2 - (hasVerticalCaption ? 0 : captionArea));

  return {
    canvasW,
    canvasH,
    scale,
    isWhiteBottom,
    hasVerticalCaption,
    captionArea,
    photoX,
    photoY,
    photoW,
    photoH,
  };
}

function getCropLimits(image, settings) {
  if (!image) return { maxOffsetX: 0, maxOffsetY: 0 };
  const { photoW, photoH } = getFrameLayout(settings);
  const base = fitRect(image.naturalWidth, image.naturalHeight, photoW, photoH, "cover");
  const cropZoom = clamp(Number(settings.cropZoom) || 1, 1, 3);

  return {
    maxOffsetX: Math.max(0, (base.w * cropZoom - photoW) / 2),
    maxOffsetY: Math.max(0, (base.h * cropZoom - photoH) / 2),
  };
}

function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawBlurredBackground(ctx, image, canvasW, canvasH) {
  const bg = fitRect(image.naturalWidth, image.naturalHeight, canvasW, canvasH, "cover");
  ctx.save();
  ctx.filter = "blur(26px) brightness(0.55) saturate(0.85)";
  ctx.drawImage(image, bg.x - 40, bg.y - 40, bg.w + 80, bg.h + 80);
  ctx.restore();

  const gradient = ctx.createRadialGradient(canvasW / 2, canvasH / 2, 120, canvasW / 2, canvasH / 2, canvasW * 0.75);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasW, canvasH);
}

function drawFittedCenterText(ctx, text, x, y, maxWidth) {
  if (!text) return;
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, x, y);
    return;
  }

  let fitted = text;
  while (fitted.length > 1 && ctx.measureText(`${fitted}...`).width > maxWidth) {
    fitted = fitted.slice(0, -1);
  }
  ctx.fillText(`${fitted}...`, x, y);
}

function drawFittedLeftText(ctx, text, x, y, maxWidth) {
  if (!text || maxWidth <= 0) return;
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, x, y);
    return;
  }

  let fitted = text;
  while (fitted.length > 1 && ctx.measureText(`${fitted}...`).width > maxWidth) {
    fitted = fitted.slice(0, -1);
  }
  ctx.fillText(`${fitted}...`, x, y);
}

function drawFittedRightText(ctx, text, x, y, maxWidth) {
  if (!text || maxWidth <= 0) return;
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, x, y);
    return;
  }

  let fitted = text;
  while (fitted.length > 1 && ctx.measureText(`...${fitted}`).width > maxWidth) {
    fitted = fitted.slice(1);
  }
  ctx.fillText(`...${fitted}`, x, y);
}

const cameraLogoCache = new Map();

function getCameraLogo(brandKey) {
  const src = CAMERA_BRAND_LOGOS[brandKey];
  if (!src) return null;
  const cached = cameraLogoCache.get(brandKey);
  if (cached) return cached;

  const image = new Image();
  const entry = {
    image,
    loaded: false,
    promise: new Promise((resolve) => {
      image.onload = () => {
        entry.loaded = true;
        resolve(image);
      };
      image.onerror = () => resolve(null);
    }),
  };

  image.src = src;
  cameraLogoCache.set(brandKey, entry);
  return entry;
}

async function preloadCameraLogo(make) {
  const entry = getCameraLogo(getCameraBrandKey(make));
  if (!entry) return null;
  return entry.loaded ? entry.image : entry.promise;
}

function drawCameraBrandLogo(ctx, logo, x, y, maxW, maxH, filter, align = "baseline") {
  const ratio = logo.naturalWidth / logo.naturalHeight || 1;
  let w = maxH * ratio;
  let h = maxH;

  if (w > maxW) {
    w = maxW;
    h = w / ratio;
  }

  ctx.save();
  if (filter) ctx.filter = filter;
  ctx.drawImage(logo, x, align === "center" ? y - h / 2 : y - h + 3, w, h);
  ctx.restore();
  return { w, h };
}

function drawTextBlock(ctx, { make, brandKey, model, lens, focal, aperture, shutter, iso }, canvasW, y, options) {
  const scale = options.scale;
  const logoSize = 25 * scale;
  const modelSize = 25 * scale;
  const metaSize = 22 * scale;
  const lensSize = 18 * scale;
  const lineGap = 31 * scale;
  const lensGap = 27 * scale;
  const maxTextWidth = canvasW - 160 * scale;
  const cameraText = [make, model].filter(Boolean).join(" ");
  const metaParts = [focal, aperture, shutter, iso ? `ISO-${iso}` : ""].filter(Boolean);
  const metaText = metaParts.join("   ");
  const lensText = options.showLensInfo && lens ? lens : "";
  const textColor = options.textColor || "rgba(255,255,255,0.98)";
  const modelColor = options.modelColor || "rgba(255,255,255,0.95)";
  const mutedTextColor = options.mutedTextColor || "rgba(255,255,255,0.78)";
  const logoEntry = getCameraLogo(brandKey);
  const cameraLogo = logoEntry?.loaded ? logoEntry.image : null;

  if (logoEntry && !logoEntry.loaded && options.onAssetLoad) {
    logoEntry.promise.then(options.onAssetLoad);
  }

  if (!cameraText && !metaText && !lensText) return;

  if (options.oneLine) {
    const leftX = 70 * scale;
    const rightX = canvasW - 70 * scale;
    const oneLineLogoSize = 35 * scale;
    const oneLineModelSize = 33 * scale;
    const oneLineMetaSize = 30 * scale;
    const centerY = y;
    const modelBaseline = centerY + oneLineModelSize * 0.35;
    const metaBaseline = centerY + oneLineMetaSize * 0.35;
    const settingsText = metaText || lensText;

    ctx.save();
    ctx.textBaseline = "alphabetic";

    ctx.font = `500 ${oneLineMetaSize}px Arial, sans-serif`;
    const maxSettingsW = canvasW * 0.43;
    const settingsW = Math.min(ctx.measureText(settingsText).width, maxSettingsW);
    const separatorX = rightX - settingsW - 32 * scale;

    if (settingsText) {
      ctx.strokeStyle = "rgba(18,18,18,0.28)";
      ctx.lineWidth = Math.max(1, 2 * scale);
      ctx.beginPath();
      ctx.moveTo(separatorX, centerY - 25 * scale);
      ctx.lineTo(separatorX, centerY + 25 * scale);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.textAlign = "right";
      drawFittedRightText(ctx, settingsText, rightX, metaBaseline, maxSettingsW);
    }

    const cameraMaxW = (settingsText ? separatorX - 28 * scale : rightX) - leftX;
    ctx.textAlign = "left";

    if (cameraLogo) {
      const brandLogoScale = CAMERA_BRAND_LOGO_SCALE[brandKey] || 1;
      const logoMaxH = oneLineLogoSize * 1.05 * brandLogoScale;
      const logoMaxW = 230 * scale * brandLogoScale;
      const gap = model ? 18 * scale : 0;
      const drawnLogo = drawCameraBrandLogo(ctx, cameraLogo, leftX, centerY, logoMaxW, logoMaxH, options.logoFilter, "center");

      if (model) {
        ctx.font = `500 ${oneLineModelSize}px Arial, sans-serif`;
        ctx.fillStyle = modelColor;
        drawFittedLeftText(ctx, model, leftX + drawnLogo.w + gap, modelBaseline, cameraMaxW - drawnLogo.w - gap);
      }
    } else {
      const makeText = make && model ? make : cameraText;
      const modelText = make && model ? ` ${model}` : "";

      ctx.font = `700 ${oneLineModelSize}px Georgia, Times New Roman, serif`;
      ctx.fillStyle = make ? options.brandColor : modelColor;
      const makeW = Math.min(ctx.measureText(makeText).width, cameraMaxW);
      drawFittedLeftText(ctx, makeText, leftX, modelBaseline, cameraMaxW);

      if (modelText && makeW < cameraMaxW) {
        ctx.font = `500 ${oneLineModelSize}px Arial, sans-serif`;
        ctx.fillStyle = modelColor;
        drawFittedLeftText(ctx, modelText, leftX + makeW, modelBaseline, cameraMaxW - makeW);
      }
    }

    ctx.restore();
    return;
  }

  ctx.save();
  ctx.textBaseline = "alphabetic";

  if (cameraText) {
    if (cameraLogo) {
      const brandLogoScale = CAMERA_BRAND_LOGO_SCALE[brandKey] || 1;
      const logoMaxH = logoSize * 1.05 * brandLogoScale;
      const logoMaxW = 180 * scale * brandLogoScale;
      const logoRatio = cameraLogo.naturalWidth / cameraLogo.naturalHeight || 1;
      const logoW = Math.min(logoMaxW, logoMaxH * logoRatio);
      const gap = model ? 12 * scale : 0;

      ctx.font = `400 ${modelSize}px Arial, sans-serif`;
      const modelW = model ? ctx.measureText(model).width : 0;
      const startX = canvasW / 2 - (logoW + gap + modelW) / 2;
      const drawnLogo = drawCameraBrandLogo(ctx, cameraLogo, startX, y, logoMaxW, logoMaxH, options.logoFilter);

      if (model) {
        ctx.fillStyle = modelColor;
        ctx.textAlign = "left";
        ctx.fillText(model, startX + drawnLogo.w + gap, y);
      }
    } else if (make && model) {
      ctx.font = `700 ${logoSize}px Georgia, Times New Roman, serif`;
      const makeW = ctx.measureText(make).width;
      ctx.font = `400 ${modelSize}px Arial, sans-serif`;
      const modelText = ` ${model}`;
      const modelW = ctx.measureText(modelText).width;
      const startX = canvasW / 2 - (makeW + modelW) / 2;

      ctx.font = `700 ${logoSize}px Georgia, Times New Roman, serif`;
      ctx.fillStyle = options.brandColor;
      ctx.textAlign = "left";
      ctx.fillText(make, startX, y);

      ctx.font = `400 ${modelSize}px Arial, sans-serif`;
      ctx.fillStyle = modelColor;
      ctx.fillText(modelText, startX + makeW, y);
    } else {
      ctx.font = `700 ${logoSize}px Georgia, Times New Roman, serif`;
      ctx.fillStyle = make ? options.brandColor : modelColor;
      ctx.textAlign = "center";
      drawFittedCenterText(ctx, cameraText, canvasW / 2, y, maxTextWidth);
    }
  }

  ctx.font = `400 ${metaSize}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = textColor;
  const metaY = y + (cameraText ? lineGap : 0);
  drawFittedCenterText(ctx, metaText, canvasW / 2, metaY, maxTextWidth);

  if (lensText) {
    ctx.font = `400 ${lensSize}px Arial, sans-serif`;
    ctx.fillStyle = mutedTextColor;
    drawFittedCenterText(ctx, lensText, canvasW / 2, metaY + (metaText ? lensGap : 0), maxTextWidth);
  }
  ctx.restore();
}

function drawIcon(ctx, type, x, y, size, color) {
  if (type === "none") return 0;

  ctx.save();
  ctx.lineWidth = Math.max(1.5, size * 0.09);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  if (type === "instagram") {
    roundRectPath(ctx, x, y, size, size, size * 0.25);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + size * 0.5, y + size * 0.5, size * 0.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + size * 0.74, y + size * 0.26, size * 0.055, 0, Math.PI * 2);
    ctx.fill();
  }

  if (type === "telegram") {
    ctx.beginPath();
    ctx.moveTo(x + size * 0.08, y + size * 0.48);
    ctx.lineTo(x + size * 0.9, y + size * 0.16);
    ctx.lineTo(x + size * 0.7, y + size * 0.86);
    ctx.lineTo(x + size * 0.44, y + size * 0.62);
    ctx.lineTo(x + size * 0.31, y + size * 0.76);
    ctx.lineTo(x + size * 0.34, y + size * 0.56);
    ctx.closePath();
    ctx.fill();
  }

  if (type === "camera") {
    roundRectPath(ctx, x, y + size * 0.18, size, size * 0.68, size * 0.13);
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(x + size * 0.18, y + size * 0.08, size * 0.26, size * 0.14);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + size * 0.52, y + size * 0.52, size * 0.2, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
  return size;
}

function getAdaptiveColor(ctx, x, y, sampleSize = 12) {
  try {
    const data = ctx.getImageData(x, y, sampleSize, sampleSize).data;
    let total = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      total += 0.299 * r + 0.587 * g + 0.114 * b;
    }

    const avg = total / (data.length / 4);
    return avg > 150 ? "rgba(20,20,20,1)" : "rgba(255,255,255,1)";
  } catch {
    return "rgba(255,255,255,1)";
  }
}

function drawWatermarks(ctx, watermarks, photoX, photoY, scale) {
  const active = watermarks.filter((item) => item.text.trim());

  active.forEach((item, index) => {
    const fontSize = item.size * scale;
    const iconSize = fontSize * 1.05;
    const gap = item.icon === "none" ? 0 : fontSize * 0.35;

    const x = photoX + item.x * scale;
    const y = photoY + item.y * scale + index * item.lineOffset * scale;

    const adaptiveColor = getAdaptiveColor(ctx, x, y);

    ctx.save();
    ctx.globalAlpha = item.opacity;
    ctx.fillStyle = adaptiveColor;
    ctx.strokeStyle = adaptiveColor;
    ctx.shadowColor = adaptiveColor === "rgba(255,255,255,1)" ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.25)";
    ctx.shadowBlur = fontSize * 0.25;

    ctx.font = `500 ${fontSize}px Arial, sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    if (item.icon !== "none") {
      drawIcon(ctx, item.icon, x, y - iconSize / 2, iconSize, adaptiveColor);
    }

    ctx.fillText(item.text.trim(), x + (item.icon === "none" ? 0 : iconSize + gap), y);

    ctx.restore();
  });
}

function drawRuleOfThirds(ctx, x, y, w, h, scale) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.82)";
  ctx.lineWidth = Math.max(1, 1.4 * scale);
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 6 * scale;
  ctx.beginPath();

  for (let i = 1; i <= 2; i += 1) {
    const thirdX = x + (w * i) / 3;
    const thirdY = y + (h * i) / 3;
    ctx.moveTo(thirdX, y);
    ctx.lineTo(thirdX, y + h);
    ctx.moveTo(x, thirdY);
    ctx.lineTo(x + w, thirdY);
  }

  ctx.stroke();
  ctx.restore();
}

function drawCropPreview(ctx, image, settings, layout) {
  const { canvasW, canvasH, scale, photoX, photoY, photoW, photoH } = layout;
  const photo = coverRectWithCrop(image.naturalWidth, image.naturalHeight, photoW, photoH, settings.cropZoom, settings.cropX, settings.cropY);

  ctx.fillStyle = "#08090a";
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.drawImage(image, photoX + photo.x, photoY + photo.y, photo.w, photo.h);

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.52)";
  ctx.beginPath();
  ctx.rect(0, 0, canvasW, canvasH);
  ctx.rect(photoX, photoY, photoW, photoH);
  ctx.fill("evenodd");
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = Math.max(2, 2.4 * scale);
  ctx.strokeRect(photoX, photoY, photoW, photoH);
  ctx.restore();

  drawRuleOfThirds(ctx, photoX, photoY, photoW, photoH, scale);
}

function renderFrame(canvas, image, exif, settings, options = {}) {
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx || !image) return;

  const layout = getFrameLayout(settings);
  const { canvasW, canvasH, scale, isWhiteBottom, hasVerticalCaption, captionArea, photoX, photoY, photoW, photoH } = layout;
  canvas.width = canvasW;
  canvas.height = canvasH;

  ctx.clearRect(0, 0, canvasW, canvasH);

  if (options.cropPreview) {
    drawCropPreview(ctx, image, settings, layout);
    return;
  }

  if (isWhiteBottom) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasW, canvasH);
  } else {
    drawBlurredBackground(ctx, image, canvasW, canvasH);
  }

  const radius = isWhiteBottom ? 0 : settings.photoRadius * scale;

  ctx.save();
  roundRectPath(ctx, photoX, photoY, photoW, photoH, radius);
  ctx.clip();
  const photo = coverRectWithCrop(image.naturalWidth, image.naturalHeight, photoW, photoH, settings.cropZoom, settings.cropX, settings.cropY);
  ctx.drawImage(image, photoX + photo.x, photoY + photo.y, photo.w, photo.h);
  drawWatermarks(ctx, settings.watermarks, photoX, photoY, scale);
  ctx.restore();

  if (isWhiteBottom) {
    ctx.save();
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.lineWidth = Math.max(1, 1.2 * scale);
    ctx.beginPath();
    ctx.moveTo(0, photoY + photoH);
    ctx.lineTo(canvasW, photoY + photoH);
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.save();
    roundRectPath(ctx, photoX, photoY, photoW, photoH, radius);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
    ctx.restore();
  }

  const textOptions = {
    scale,
    brandColor: settings.brandColor,
    showLensInfo: settings.showLensInfo,
    logoFilter: isWhiteBottom ? "" : "brightness(0) invert(1)",
    oneLine: isWhiteBottom,
    onAssetLoad: options.onAssetLoad,
    ...(isWhiteBottom
      ? {
          textColor: "rgba(18,18,18,0.94)",
          modelColor: "rgba(18,18,18,0.9)",
          mutedTextColor: "rgba(18,18,18,0.62)",
        }
      : {}),
  };

  if (isWhiteBottom) {
    drawTextBlock(ctx, getDisplay(exif), canvasW, photoY + photoH + captionArea / 2, textOptions);
  } else if (hasVerticalCaption) {
    ctx.save();
    ctx.translate(photoX + photoW + captionArea / 2, canvasH / 2);
    ctx.rotate(Math.PI / 2);
    drawTextBlock(ctx, getDisplay(exif), canvasH, -18 * scale, textOptions);
    ctx.restore();
  } else {
    drawTextBlock(ctx, getDisplay(exif), canvasW, photoY + photoH + 45 * scale, textOptions);
  }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not open the image."));
    image.src = url;
  });
}

async function readExif(file) {
  try {
    return parseExif(await file.arrayBuffer());
  } catch {
    return {};
  }
}

async function loadPhoto(file, settingsTemplate) {
  const url = URL.createObjectURL(file);

  try {
    const [image, exif] = await Promise.all([loadImage(url), readExif(file)]);
    return {
      id: createId(),
      fileName: file.name,
      url,
      image,
      exif,
      settings: cloneSettings(settingsTemplate),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not prepare the PNG."));
    }, "image/png", 1);
  });
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function sanitizeFileName(value) {
  return value
    .replace(/\.[^.]+$/, "")
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70) || "photo";
}

function getOutputName(photo, index) {
  const number = String(index + 1).padStart(2, "0");
  return `${number}-${sanitizeFileName(photo.fileName)}-frame.png`;
}

async function renderPhotoToBlob(photo) {
  await preloadCameraLogo(photo.exif?.Make);
  const canvas = document.createElement("canvas");
  renderFrame(canvas, photo.image, photo.exif, photo.settings);
  return canvasToBlob(canvas);
}

export default function App() {
  const canvasRef = useRef(null);
  const previewStageRef = useRef(null);
  const cropDragRef = useRef(null);
  const photosRef = useRef([]);
  const [photos, setPhotos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [importMessage, setImportMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [savingMode, setSavingMode] = useState("");
  const [isCropping, setIsCropping] = useState(false);
  const [captionEditingPhotoId, setCaptionEditingPhotoId] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [language, setLanguage] = useState("en");

  const emptySettings = useMemo(() => createDefaultSettings(), []);
  const activePhoto = useMemo(() => photos.find((photo) => photo.id === selectedId) || photos[0] || null, [photos, selectedId]);
  const activeIndex = useMemo(() => photos.findIndex((photo) => photo.id === activePhoto?.id), [photos, activePhoto]);
  const display = useMemo(() => getDisplay(activePhoto?.exif || {}), [activePhoto]);
  const t = TRANSLATIONS[language];
  const currentLanguage = LANGUAGES.find((item) => item.value === language) || LANGUAGES[0];

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => () => {
    photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url));
  }, []);

  const render = useCallback(() => {
    if (!activePhoto) return;
    renderFrame(canvasRef.current, activePhoto.image, activePhoto.exif, activePhoto.settings, {
      cropPreview: isCropping,
      onAssetLoad: () => renderFrame(canvasRef.current, activePhoto.image, activePhoto.exif, activePhoto.settings, { cropPreview: isCropping }),
    });
  }, [activePhoto, isCropping]);

  useEffect(() => {
    render();
  }, [render]);

  const handleFiles = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selectedFiles.length) return;

    const validFiles = selectedFiles.filter(isImageFile);
    const skippedCount = selectedFiles.length - validFiles.length;

    if (!validFiles.length) {
      setImportMessage(t.noSupportedImages);
      return;
    }

    setIsImporting(true);
    setImportMessage("");

    const settingsTemplate = activePhoto?.settings || createDefaultSettings();
    const loaded = [];
    let failedCount = 0;

    for (const file of validFiles) {
      try {
        loaded.push(await loadPhoto(file, settingsTemplate));
      } catch {
        failedCount += 1;
      }
    }

    if (loaded.length) {
      setPhotos((prev) => [...prev, ...loaded]);
      setSelectedId((prev) => prev || loaded[0].id);
    }

    const notes = [];
    if (loaded.length) notes.push(t.added(loaded.length));
    if (skippedCount) notes.push(t.skipped(skippedCount));
    if (failedCount) notes.push(t.failed(failedCount));
    setImportMessage(notes.join(". "));
    setIsImporting(false);
  };

  const updateActiveSettings = useCallback((updater) => {
    if (!activePhoto) return;
    setPhotos((prev) => prev.map((photo) => {
      if (photo.id !== activePhoto.id) return photo;
      return { ...photo, settings: updater(photo.settings) };
    }));
  }, [activePhoto]);

  const updateSetting = (key, value) => {
    updateActiveSettings((settings) => ({ ...settings, [key]: value }));
  };

  const updateCaptionData = (key, value) => {
    if (!activePhoto) return;
    setPhotos((prev) => prev.map((photo) => {
      if (photo.id !== activePhoto.id) return photo;
      return { ...photo, exif: { ...photo.exif, [key]: value } };
    }));
  };

  const updateCropZoom = useCallback((step) => {
    updateActiveSettings((settings) => ({ ...settings, cropZoom: clamp(Number(settings.cropZoom) + step, 1, 3) }));
  }, [updateActiveSettings]);

  const resetCrop = () => {
    updateActiveSettings((settings) => ({ ...settings, cropZoom: 1, cropX: 0, cropY: 0 }));
  };

  const getCanvasPoint = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
      rect,
    };
  };

  const isPointInPhoto = (point) => {
    if (!activePhoto || !point) return false;
    const { photoX, photoY, photoW, photoH } = getFrameLayout(activePhoto.settings);
    return point.x >= photoX && point.x <= photoX + photoW && point.y >= photoY && point.y <= photoY + photoH;
  };

  const handleCanvasPointerDown = (event) => {
    if (!activePhoto) return;

    const point = getCanvasPoint(event);
    if (!isPointInPhoto(point)) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    cropDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      cropX: activePhoto.settings.cropX,
      cropY: activePhoto.settings.cropY,
      rect: point.rect,
      canvasW: canvasRef.current.width,
      canvasH: canvasRef.current.height,
      limits: getCropLimits(activePhoto.image, activePhoto.settings),
    };
    setIsCropping(true);
  };

  const handleCanvasPointerMove = (event) => {
    const drag = cropDragRef.current;
    if (!activePhoto || !drag || drag.pointerId !== event.pointerId) return;

    const deltaX = (event.clientX - drag.startX) * (drag.canvasW / drag.rect.width);
    const deltaY = (event.clientY - drag.startY) * (drag.canvasH / drag.rect.height);
    const nextX = drag.limits.maxOffsetX ? drag.cropX + (deltaX / drag.limits.maxOffsetX) * 100 : 0;
    const nextY = drag.limits.maxOffsetY ? drag.cropY + (deltaY / drag.limits.maxOffsetY) * 100 : 0;

    updateActiveSettings((settings) => ({
      ...settings,
      cropX: Math.round(clamp(nextX, -100, 100)),
      cropY: Math.round(clamp(nextY, -100, 100)),
    }));
  };

  const stopCanvasCrop = (event) => {
    if (cropDragRef.current?.pointerId === event.pointerId) {
      cropDragRef.current = null;
      setIsCropping(false);
    }
  };

  const zoomCropFromWheel = useCallback((event) => {
    if (!activePhoto) return;

    event.preventDefault();
    event.stopPropagation();

    const direction = event.deltaY > 0 ? -1 : 1;
    const step = event.ctrlKey ? 0.04 : 0.08;
    updateCropZoom(direction * step);
  }, [activePhoto, updateCropZoom]);

  useEffect(() => {
    const stage = previewStageRef.current;
    if (!stage) return undefined;

    const handleWheel = (event) => {
      if (!activePhoto) return;
      zoomCropFromWheel(event);
    };

    stage.addEventListener("wheel", handleWheel, { passive: false });
    return () => stage.removeEventListener("wheel", handleWheel);
  }, [activePhoto, zoomCropFromWheel]);

  const updateWatermark = (id, key, value) => {
    updateActiveSettings((settings) => ({
      ...settings,
      watermarks: settings.watermarks.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  };

  const addWatermark = () => {
    updateActiveSettings((settings) => ({ ...settings, watermarks: [...settings.watermarks, newWatermark()] }));
  };

  const removeWatermark = (id) => {
    updateActiveSettings((settings) => ({ ...settings, watermarks: settings.watermarks.filter((item) => item.id !== id) }));
  };

  const applySettingsToAll = () => {
    if (!activePhoto) return;
    const template = activePhoto.settings;
    setPhotos((prev) => prev.map((photo) => ({ ...photo, settings: cloneSettings(template) })));
  };

  const removePhoto = (id) => {
    const index = photos.findIndex((photo) => photo.id === id);
    const photo = photos[index];
    if (!photo) return;

    URL.revokeObjectURL(photo.url);
    const nextPhotos = photos.filter((item) => item.id !== id);
    setPhotos(nextPhotos);

    if (selectedId === id) {
      setSelectedId(nextPhotos[Math.min(index, nextPhotos.length - 1)]?.id || null);
    }
  };

  const clearPhotos = () => {
    photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    setPhotos([]);
    setSelectedId(null);
    setImportMessage("");
  };

  const downloadSelected = async () => {
    if (!activePhoto) return;

    setSavingMode("single");
    try {
      const blob = await renderPhotoToBlob(activePhoto);
      downloadBlob(blob, getOutputName(activePhoto, Math.max(activeIndex, 0)));
    } finally {
      setSavingMode("");
    }
  };

  const downloadBatch = async () => {
    if (!photos.length) return;

    setSavingMode("batch");
    try {
      const zip = new JSZip();

      for (let index = 0; index < photos.length; index += 1) {
        const photo = photos[index];
        const blob = await renderPhotoToBlob(photo);
        zip.file(getOutputName(photo, index), blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, "exif-frame-batch.zip");
    } finally {
      setSavingMode("");
    }
  };

  const settings = activePhoto?.settings || emptySettings;
  const hasPhotos = photos.length > 0;
  const isCaptionEditing = Boolean(activePhoto && captionEditingPhotoId === activePhoto.id);

  return (
    <main className="app-shell">
      <aside className="control-panel">
        <header className="panel-header">
          <div className="header-topline">
            <p className="eyebrow">EXIF Frame</p>
            <div className="language-menu">
              <button
                type="button"
                className="language-trigger"
                aria-label={t.language}
                aria-expanded={isLanguageOpen}
                onClick={() => setIsLanguageOpen((value) => !value)}
              >
                {currentLanguage.label}
              </button>
              {isLanguageOpen && (
                <div className="language-options" role="menu">
                  {LANGUAGES.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={item.value === language ? "active" : ""}
                      role="menuitemradio"
                      aria-checked={item.value === language}
                      onClick={() => {
                        setLanguage(item.value);
                        setIsLanguageOpen(false);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <h1>{t.appTitle}</h1>
          <p>
            {t.appDescription}
          </p>
        </header>

        <label className="upload-box">
          <input type="file" accept="image/*,.jpg,.jpeg,.png,.webp" multiple onChange={handleFiles} />
          <span className="upload-title">{isImporting ? t.loading : t.addPhotos}</span>
          <span className="upload-note">{hasPhotos ? t.photosInSet(photos.length) : t.uploadNote}</span>
        </label>

        {importMessage && <div className="status-message">{importMessage}</div>}

        <div className="batch-actions">
          <button type="button" className="secondary-button" disabled={!activePhoto || photos.length < 2} onClick={applySettingsToAll}>
            {t.applyToAll}
          </button>
          <button type="button" className="secondary-button" disabled={!activePhoto || Boolean(savingMode)} onClick={downloadSelected}>
            {savingMode === "single" ? t.saving : t.saveFrame}
          </button>
          <button type="button" className="download-button compact-button" disabled={!hasPhotos || Boolean(savingMode)} onClick={downloadBatch}>
            {savingMode === "batch" ? t.buildingZip : t.saveZipBatch}
          </button>
        </div>

        <section className="selected-card">
          <h2>{t.selectedFrame}</h2>
          {activePhoto ? (
            <>
              <p>{activeIndex + 1} {t.of} {photos.length}</p>
              <strong>{activePhoto.fileName}</strong>
            </>
          ) : (
            <p>{t.addPhotosToSetUp}</p>
          )}
        </section>

        <section className={`settings-group ${isSettingsOpen ? "open" : ""}`} aria-label={t.selectedFrameSettings}>
          <button
            type="button"
            className="settings-toggle"
            aria-expanded={isSettingsOpen}
            onClick={() => setIsSettingsOpen((value) => !value)}
          >
            <span>{t.frameSettings}</span>
            <span aria-hidden="true">{isSettingsOpen ? t.hide : t.show}</span>
          </button>

          <div className="settings-content" aria-hidden={!isSettingsOpen} inert={!isSettingsOpen}>
            <label className="field">
              <span>{t.format}</span>
              <select value={settings.ratio} disabled={!activePhoto} onChange={(e) => updateSetting("ratio", e.target.value)}>
                {ASPECT_RATIOS.map((ratio) => (
                  <option key={ratio.value} value={ratio.value}>{t[ratio.labelKey]}</option>
                ))}
                <option value="custom">{t.customRatio}</option>
              </select>
            </label>

            <label className="field">
              <span>{t.frameStyle}</span>
              <select value={settings.frameStyle || "ambient"} disabled={!activePhoto} onChange={(e) => updateSetting("frameStyle", e.target.value)}>
                {FRAME_STYLES.map((style) => (
                  <option key={style.value} value={style.value}>{t[style.labelKey]}</option>
                ))}
              </select>
            </label>

            {settings.ratio === "custom" && (
              <div className="inline-fields ratio-fields">
                <label className="field compact">
                  <span>{t.width}</span>
                  <input type="number" min="1" max="99" disabled={!activePhoto} value={settings.customRatioW} onChange={(e) => updateSetting("customRatioW", clamp(Number(e.target.value) || 1, 1, 99))} />
                </label>
                <label className="field compact">
                  <span>{t.height}</span>
                  <input type="number" min="1" max="99" disabled={!activePhoto} value={settings.customRatioH} onChange={(e) => updateSetting("customRatioH", clamp(Number(e.target.value) || 1, 1, 99))} />
                </label>
              </div>
            )}

            <label className="field">
              <span>{t.caption}</span>
              <select value={settings.captionOrientation} disabled={!activePhoto} onChange={(e) => updateSetting("captionOrientation", e.target.value)}>
                <option value="horizontal">{t.horizontalCaption}</option>
                <option value="vertical">{t.verticalCaption}</option>
              </select>
            </label>

            <div className="crop-control">
              <span>{t.crop}: {Math.round(settings.cropZoom * 100)}%</span>
              <div className="crop-actions">
                <button type="button" className="secondary-button icon-button" disabled={!activePhoto || settings.cropZoom <= 1} onClick={() => updateCropZoom(-0.1)} aria-label={t.decreaseCrop}>−</button>
                <button type="button" className="secondary-button icon-button" disabled={!activePhoto || settings.cropZoom >= 3} onClick={() => updateCropZoom(0.1)} aria-label={t.increaseCrop}>+</button>
                <button type="button" className="secondary-button reset-button" disabled={!activePhoto} onClick={resetCrop}>{t.reset}</button>
              </div>
            </div>

            <label className="field">
              <span>{t.exportSize}: {settings.outputSize}px</span>
              <input type="range" min="900" max="2400" step="100" disabled={!activePhoto} value={settings.outputSize} onChange={(e) => updateSetting("outputSize", Number(e.target.value))} />
            </label>

            <label className="field">
              <span>{t.framePadding}: {settings.framePadding}px</span>
              <input type="range" min="28" max="140" disabled={!activePhoto} value={settings.framePadding} onChange={(e) => updateSetting("framePadding", Number(e.target.value))} />
            </label>

            <label className="field">
              <span>{t.bottomCaption}: {settings.bottomArea}px</span>
              <input type="range" min="90" max="180" disabled={!activePhoto} value={settings.bottomArea} onChange={(e) => updateSetting("bottomArea", Number(e.target.value))} />
            </label>

            <label className="field">
              <span>{t.photoCornerRadius}: {settings.photoRadius}px</span>
              <input type="range" min="0" max="40" disabled={!activePhoto} value={settings.photoRadius} onChange={(e) => updateSetting("photoRadius", Number(e.target.value))} />
            </label>

            <label className="field">
              <span>{t.brandColor}</span>
              <input type="color" disabled={!activePhoto} value={settings.brandColor} onChange={(e) => updateSetting("brandColor", e.target.value)} />
            </label>

            <label className="checkbox-field">
              <input type="checkbox" disabled={!activePhoto} checked={settings.showLensInfo} onChange={(e) => updateSetting("showLensInfo", e.target.checked)} />
              <span>{t.lensInformation}</span>
            </label>
          </div>
        </section>

        <section className="watermarks">
          <div className="section-title">
            <h2>{t.watermarks}</h2>
            <button type="button" className="text-action" disabled={!activePhoto} onClick={addWatermark}>{t.add}</button>
          </div>

          <div className="watermark-list">
            {settings.watermarks.map((item, index) => (
              <article key={item.id} className="watermark-card">
                <div className="card-title">
                  <h3>{t.watermarkCaption} {index + 1}</h3>
                  <button type="button" className="danger-button" disabled={!activePhoto} onClick={() => removeWatermark(item.id)}>{t.remove}</button>
                </div>

                <label className="field compact">
                  <span>{t.text}</span>
                  <input disabled={!activePhoto} value={item.text} onChange={(e) => updateWatermark(item.id, "text", e.target.value)} placeholder="@username" />
                </label>

                <label className="field compact">
                  <span>{t.icon}</span>
                  <select disabled={!activePhoto} value={item.icon} onChange={(e) => updateWatermark(item.id, "icon", e.target.value)}>
                    {Object.entries(ICONS).map(([value, labelKey]) => (
                      <option key={value} value={value}>{t[`icon${labelKey.charAt(0).toUpperCase()}${labelKey.slice(1)}`]}</option>
                    ))}
                  </select>
                </label>

                <label className="field compact">
                  <span>{t.size}: {item.size}px</span>
                  <input type="range" min="10" max="64" disabled={!activePhoto} value={item.size} onChange={(e) => updateWatermark(item.id, "size", Number(e.target.value))} />
                </label>

                <label className="field compact">
                  <span>{t.opacity}: {Math.round(item.opacity * 100)}%</span>
                  <input type="range" min="0.05" max="1" step="0.05" disabled={!activePhoto} value={item.opacity} onChange={(e) => updateWatermark(item.id, "opacity", Number(e.target.value))} />
                </label>

                <div className="inline-fields">
                  <label className="field compact">
                    <span>X: {item.x}px</span>
                    <input type="range" min="0" max="300" disabled={!activePhoto} value={item.x} onChange={(e) => updateWatermark(item.id, "x", Number(e.target.value))} />
                  </label>
                  <label className="field compact">
                    <span>Y: {item.y}px</span>
                    <input type="range" min="0" max="300" disabled={!activePhoto} value={item.y} onChange={(e) => updateWatermark(item.id, "y", Number(e.target.value))} />
                  </label>
                </div>

                <label className="field compact">
                  <span>{t.lineOffset}: {item.lineOffset}px</span>
                  <input type="range" min="18" max="90" disabled={!activePhoto} value={item.lineOffset} onChange={(e) => updateWatermark(item.id, "lineOffset", Number(e.target.value))} />
                </label>
              </article>
            ))}
          </div>
        </section>

        <section className="exif-summary">
          <div className="section-title">
            <h2>{t.captionData}</h2>
            <button
              type="button"
              className="text-action"
              disabled={!activePhoto}
              onClick={() => setCaptionEditingPhotoId((value) => (value === activePhoto?.id ? null : activePhoto?.id))}
            >
              {isCaptionEditing ? t.done : t.edit}
            </button>
          </div>

          {isCaptionEditing && activePhoto ? (
            <div className="caption-fields">
              <div className="inline-fields">
                <label className="field compact">
                  <span>{t.make}</span>
                  <input value={activePhoto.exif.Make || ""} onChange={(e) => updateCaptionData("Make", e.target.value)} placeholder="Canon" />
                </label>
                <label className="field compact">
                  <span>{t.model}</span>
                  <input value={activePhoto.exif.Model || ""} onChange={(e) => updateCaptionData("Model", e.target.value)} placeholder="EOS R5" />
                </label>
              </div>

              <label className="field compact">
                <span>{t.lens}</span>
                <input value={activePhoto.exif.LensModel || ""} onChange={(e) => updateCaptionData("LensModel", e.target.value)} placeholder="RF 24-70mm F2.8L" />
              </label>

              <div className="inline-fields">
                <label className="field compact">
                  <span>{t.focal}</span>
                  <input value={activePhoto.exif.FocalLength || ""} onChange={(e) => updateCaptionData("FocalLength", e.target.value)} placeholder="35mm" />
                </label>
                <label className="field compact">
                  <span>{t.aperture}</span>
                  <input value={activePhoto.exif.FNumber || ""} onChange={(e) => updateCaptionData("FNumber", e.target.value)} placeholder="F2.8" />
                </label>
              </div>

              <div className="inline-fields">
                <label className="field compact">
                  <span>{t.shutter}</span>
                  <input value={activePhoto.exif.ExposureTime || ""} onChange={(e) => updateCaptionData("ExposureTime", e.target.value)} placeholder="1/250s" />
                </label>
                <label className="field compact">
                  <span>ISO</span>
                  <input value={activePhoto.exif.ISO || ""} onChange={(e) => updateCaptionData("ISO", e.target.value)} placeholder="100" />
                </label>
              </div>
            </div>
          ) : (
            <>
              {(display.make || display.model) && <p>{t.camera}: {[display.make, display.model].filter(Boolean).join(" ")}</p>}
              {[display.focal, display.aperture, display.shutter, display.iso ? `ISO-${display.iso}` : ""].filter(Boolean).length > 0 && (
                <p>{t.settings}: {[display.focal, display.aperture, display.shutter, display.iso ? `ISO-${display.iso}` : ""].filter(Boolean).join(" / ")}</p>
              )}
              {display.lens && <p>{t.lens}: {display.lens}</p>}
              {!display.make && !display.model && !display.focal && !display.aperture && !display.shutter && !display.iso && !display.lens && (
                <p>{t.noExifData}</p>
              )}
            </>
          )}
        </section>

        <footer className="app-credit">
          <span>
            {t.createdBy}{" "}
            <a href="https://portfolio.kksihtkk.dev" target="_blank" rel="noreferrer">
              kksihtkk
            </a>
          </span>
          <a href="https://opensource.org/license/mit" target="_blank" rel="noreferrer">
            MIT License
          </a>
        </footer>
      </aside>

      <section className="workspace-panel" aria-label={t.preview}>
        <div className="preview-panel">
          <div className="preview-stage" ref={previewStageRef}>
          {!activePhoto ? (
            <div className="empty-preview">
              <div className="empty-icon" />
              <p>{t.emptyPreview}</p>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className={`preview-canvas ${isCropping ? "cropping" : ""}`}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={stopCanvasCrop}
              onPointerCancel={stopCanvasCrop}
            />
          )}

          <div className="preview-crop-control" aria-label={t.cropScale}>
            <div className="crop-control-heading">
              <span>{t.crop}</span>
              <strong>{Math.round(settings.cropZoom * 100)}%</strong>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              disabled={!activePhoto}
              value={settings.cropZoom}
              onChange={(e) => updateSetting("cropZoom", Number(e.target.value))}
              aria-label={t.cropZoom}
            />
            <div className="crop-actions">
              <button type="button" className="secondary-button icon-button" disabled={!activePhoto || settings.cropZoom <= 1} onClick={() => updateCropZoom(-0.1)} aria-label={t.zoomOut}>−</button>
              <button type="button" className="secondary-button icon-button" disabled={!activePhoto || settings.cropZoom >= 3} onClick={() => updateCropZoom(0.1)} aria-label={t.zoomIn}>+</button>
              <button type="button" className="secondary-button reset-button" disabled={!activePhoto} onClick={resetCrop}>{t.reset}</button>
            </div>
          </div>
          </div>
        </div>

        <footer className="filmstrip" aria-label={t.filmstrip}>
          <div className="filmstrip-header">
            <span>{hasPhotos ? t.filmstripCount(photos.length) : t.filmstrip}</span>
            {hasPhotos && <button type="button" className="danger-button" onClick={clearPhotos}>{t.clear}</button>}
          </div>

          <div className="filmstrip-track">
            {photos.map((photo, index) => (
              <div key={photo.id} className={`film-frame ${photo.id === activePhoto?.id ? "active" : ""}`}>
                <button type="button" className="thumb-button" onClick={() => setSelectedId(photo.id)} title={photo.fileName}>
                  <span className="frame-number">{index + 1}</span>
                  <img src={photo.url} alt={photo.fileName} />
                  <span className="frame-name">{photo.fileName}</span>
                  <span className="frame-ratio">{getRatioLabel(photo.settings)}</span>
                </button>
                <button type="button" className="thumb-remove" onClick={() => removePhoto(photo.id)} aria-label={t.removePhoto(photo.fileName)}>×</button>
              </div>
            ))}

            {!hasPhotos && (
              <div className="filmstrip-empty">{t.framesAfterUpload}</div>
            )}
          </div>
        </footer>
      </section>
    </main>
  );
}
