import { Capacitor } from "@capacitor/core";
import { registerPlugin } from "@capacitor/core";

export type InstallInfo = {
  packageName: string;
  versionName: string;
  versionCode: number;
  installerPackageName: string | null;
  signatureSha256: string | null;
  isInstalled: boolean;
};

export type InstallVerification = {
  checked: boolean;
  isNative: boolean;
  isInstalled: boolean;
  signatureMatches: boolean | null;
  installerPackageName: string | null;
  installedVersion: string | null;
  warning: string | null;
};

interface AppInstallVerifierPlugin {
  getInstallInfo(): Promise<InstallInfo>;
}

const AppInstallVerifier = registerPlugin<AppInstallVerifierPlugin>("AppInstallVerifier");

export async function verifyInstalledApp(expectedSignature?: string | null): Promise<InstallVerification> {
  if (!Capacitor.isNativePlatform()) {
    return { checked: true, isNative: false, isInstalled: false, signatureMatches: null, installerPackageName: null, installedVersion: null, warning: null };
  }
  try {
    const info = await AppInstallVerifier.getInstallInfo();
    const signatureMatches = expectedSignature && info.signatureSha256
      ? info.signatureSha256.replace(/:/g, "").toUpperCase() === expectedSignature.replace(/:/g, "").toUpperCase()
      : null;
    return {
      checked: true,
      isNative: true,
      isInstalled: info.isInstalled,
      signatureMatches,
      installerPackageName: info.installerPackageName,
      installedVersion: info.versionName,
      warning: signatureMatches === false ? "ลายเซ็นไม่ตรงกับรุ่นที่เผยแพร่ อาจต้องถอนการติดตั้งรุ่นเดิมก่อนติดตั้ง" : null,
    };
  } catch {
    return { checked: true, isNative: true, isInstalled: false, signatureMatches: null, installerPackageName: null, installedVersion: null, warning: "ยังตรวจสอบลายเซ็นการติดตั้งไม่ได้ กรุณาตรวจสอบก่อนอัปเดต" };
  }
}
