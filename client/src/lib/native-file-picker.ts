import { Capacitor, registerPlugin } from "@capacitor/core";

export type NativePickedFile = {
  fileName: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  base64: string;
};

interface NativeFilePickerPlugin {
  pickReceipt(): Promise<NativePickedFile>;
}

const NativeFilePicker = registerPlugin<NativeFilePickerPlugin>("NativeFilePicker");

export async function pickReceiptFromDevice() {
  if (!Capacitor.isNativePlatform()) return null;
  return NativeFilePicker.pickReceipt();
}
