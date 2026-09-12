import { BrowserMultiFormatReader } from "@zxing/browser";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

export type ReceiptImageMime = "image/jpeg" | "image/png";

export type ReceiptAttachment = {
  mimeType: ReceiptImageMime;
  base64: string;
  dataUrl: string;
  label: string;
};

export type DetectedCode = {
  text: string;
  format: string;
};

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function dataUrlToBase64(dataUrl: string) {
  return dataUrl.split(",")[1] ?? "";
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("ไม่สามารถเปิดภาพบิลได้"));
    image.src = dataUrl;
  });
}

function canvasToAttachment(canvas: HTMLCanvasElement, label: string): ReceiptAttachment {
  const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
  return {
    mimeType: "image/jpeg",
    base64: dataUrlToBase64(dataUrl),
    dataUrl,
    label,
  };
}

async function normalizeImage(dataUrl: string, label: string) {
  const image = await loadImage(dataUrl);
  const maxWidth = 2000;
  const scale = Math.min(1, maxWidth / image.naturalWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("เบราว์เซอร์ไม่รองรับการประมวลผลภาพ");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvasToAttachment(canvas, label);
}

async function renderPdfPages(file: File) {
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const pageCount = Math.min(pdf.numPages, 3);
  const pages: ReceiptAttachment[] = [];
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(2, 2000 / baseViewport.width);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) continue;
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    pages.push(canvasToAttachment(canvas, `หน้า ${pageNumber}`));
  }
  return pages;
}

export async function prepareReceiptAttachments(file: File) {
  if (file.type === "application/pdf") {
    const pages = await renderPdfPages(file);
    if (pages.length > 0) return pages;
    throw new Error("ไม่สามารถแปลง PDF เป็นภาพเพื่ออ่านข้อมูลได้");
  }
  return [await normalizeImage(await fileToDataUrl(file), file.name)];
}

export async function scanReceiptCodes(attachments: ReceiptAttachment[]): Promise<DetectedCode[]> {
  const reader = new BrowserMultiFormatReader();
  const detected: DetectedCode[] = [];
  const seen = new Set<string>();
  for (const attachment of attachments) {
    try {
      const result = await reader.decodeFromImageUrl(attachment.dataUrl);
      const text = result.getText().trim();
      if (text && !seen.has(text)) {
        seen.add(text);
        detected.push({ text, format: result.getBarcodeFormat().toString() });
      }
    } catch {
      // NotFoundException is expected when a page has no code; continue with the next page.
    }
  }
  return detected;
}

export function attachmentDataUrl(attachment: ReceiptAttachment) {
  return attachment.dataUrl;
}
