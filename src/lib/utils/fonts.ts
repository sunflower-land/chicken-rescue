const LOCAL_STORAGE_KEY = "settings.font";

export function cacheFont(font: Font) {
  localStorage.setItem(LOCAL_STORAGE_KEY, font);
}

export function getCachedFont(): Font {
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);

  if (!cached || !FONT_CONFIG[cached as Font]) {
    return "Default";
  }

  return cached as Font;
}

export type Font = "Default" | "Bold" | "Sans Serif" | "Chunky (Old)";

interface FontSettings {
  fontFamily: string;
  xxs: [number, number];
  xs: [number, number];
  sm: [number, number];
  base: [number, number];
  lg: [number, number];
}
export const FONT_CONFIG: Record<Font, FontSettings> = {
  Default: {
    fontFamily: "Basic",
    xxs: [20, 14],
    xs: [24, 14],
    sm: [30, 20],
    base: [36, 26],
    lg: [42, 32],
  },
  "Sans Serif": {
    fontFamily: "sans-serif",
    xxs: [14, 14],
    xs: [16, 16],
    sm: [18, 18],
    base: [25, 25],
    lg: [30, 30],
  },
  Bold: {
    fontFamily: "Secondary",
    xxs: [18, 12],
    xs: [24, 14],
    sm: [30, 20],
    base: [36, 26],
    lg: [42, 32],
  },
  "Chunky (Old)": {
    fontFamily: "Paytone One",
    xxs: [14, 14],
    xs: [16, 16],
    sm: [18, 18],
    base: [25, 25],
    lg: [30, 30],
  },
};

export const CYRILLIC_FONT_CONFIG: Record<Font, FontSettings> = {
  Default: {
    fontFamily: "Basis33",
    xxs: [20, 14],
    xs: [24, 14],
    sm: [30, 20],
    base: [36, 26],
    lg: [42, 32],
  },
  "Sans Serif": {
    fontFamily: "sans-serif",
    xxs: [14, 14],
    xs: [16, 16],
    sm: [18, 18],
    base: [25, 25],
    lg: [30, 30],
  },
  Bold: {
    fontFamily: "Born2bSporty",
    xxs: [16, 12],
    xs: [20, 14],
    sm: [26, 20],
    base: [30, 26],
    lg: [36, 32],
  },
  "Chunky (Old)": {
    fontFamily: "Russo One",
    xxs: [14, 14],
    xs: [16, 16],
    sm: [18, 18],
    base: [25, 25],
    lg: [30, 30],
  },
};

export const CHINESE_FONT_CONFIG: Partial<Record<Font, FontSettings>> = {
  Default: {
    // Pixel
    fontFamily: "Ark",
    xxs: [14, 14],
    xs: [16, 16],
    sm: [18, 18],
    base: [25, 25],
    lg: [30, 30],
  },
  "Sans Serif": {
    fontFamily: "sans-serif",
    xxs: [14, 14],
    xs: [16, 16],
    sm: [18, 18],
    base: [25, 25],
    lg: [30, 30],
  },
};

export function initialiseFont() {
  const font = getCachedFont();

  changeFont(font);
}

function setFontProperties(config: FontSettings) {
  document.documentElement.style.setProperty(
    "--font-family",
    config.fontFamily,
  );
  document.documentElement.style.setProperty(
    "--text-xxs-size",
    `${config.xxs[0]}px`,
  );
  document.documentElement.style.setProperty(
    "--text-xxs-line-height",
    `${config.xxs[1]}px`,
  );
  document.documentElement.style.setProperty(
    "--text-xs-size",
    `${config.xs[0]}px`,
  );
  document.documentElement.style.setProperty(
    "--text-xs-line-height",
    `${config.xs[1]}px`,
  );
  document.documentElement.style.setProperty(
    "--text-sm-size",
    `${config.sm[0]}px`,
  );
  document.documentElement.style.setProperty(
    "--text-sm-line-height",
    `${config.sm[1]}px`,
  );
  document.documentElement.style.setProperty(
    "--text-base-size",
    `${config.base[0]}px`,
  );
  document.documentElement.style.setProperty(
    "--text-base-line-height",
    `${config.base[1]}px`,
  );
  document.documentElement.style.setProperty(
    "--text-lg-size",
    `${config.lg[0]}px`,
  );
  document.documentElement.style.setProperty(
    "--text-lg-line-height",
    `${config.lg[1]}px`,
  );
}

export function changeFont(font: Font) {
  const lang = localStorage.getItem("language") || "en";
  const config = ["ru"].includes(lang)
    ? CYRILLIC_FONT_CONFIG[font]
    : ["zh-CN"].includes(lang)
      ? CHINESE_FONT_CONFIG[font]
      : FONT_CONFIG[font];

  if (config) {
    setFontProperties(config);
  } else {
    // Use a fallback configuration if the specified font is not found
    setFontProperties({
      fontFamily: "sans-serif",
      xxs: [14, 14],
      xs: [16, 16],
      sm: [18, 18],
      base: [25, 25],
      lg: [30, 30],
    });
  }

  cacheFont(font);
}
