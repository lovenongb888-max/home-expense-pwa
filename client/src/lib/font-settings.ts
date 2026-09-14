export type FontSize = "small" | "medium" | "large";
export type FontStyle = "cute" | "formal";

export const fontSizes: readonly FontSize[] = ["small", "medium", "large"];
export const fontStyles: readonly FontStyle[] = ["cute", "formal"];

export function readFontSize(value: string | null): FontSize {
  return fontSizes.includes(value as FontSize) ? (value as FontSize) : "medium";
}

export function readFontStyle(value: string | null): FontStyle {
  return fontStyles.includes(value as FontStyle) ? (value as FontStyle) : "cute";
}
