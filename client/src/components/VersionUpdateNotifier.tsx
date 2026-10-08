import { useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { verifyInstalledApp } from "@/lib/app-install-verifier";

const currentVersion = "1.0.10";

type VersionInfo = { latestVersion: string; downloadUrl: string | null; signatureSha256?: string | null; requiresUninstall?: boolean };

function getClientId() {
  const key = "baan-rao-client-id";
  const saved = localStorage.getItem(key);
  if (saved) return saved;
  const created = crypto.randomUUID();
  localStorage.setItem(key, created);
  return created;
}

export default function VersionUpdateNotifier() {
  const reportVersion = trpc.appStats.reportVersion.useMutation();
  useEffect(() => {
    let cancelled = false;
    if (sessionStorage.getItem("baan-rao-web-updated") === "1") {
      sessionStorage.removeItem("baan-rao-web-updated");
      const historyKey = "baan-rao-web-update-history";
      const history = (() => { try { return JSON.parse(localStorage.getItem(historyKey) ?? "[]") as Array<{ version: string; loadedAt: string }>; } catch { return []; } })();
      const nextHistory = [{ version: currentVersion, loadedAt: new Date().toISOString() }, ...history.filter(item => item.version !== currentVersion)].slice(0, 10);
      localStorage.setItem(historyKey, JSON.stringify(nextHistory));
      toast.success("อัปเดตเว็บสำเร็จ", { description: "บ้านเราโหลดฟีเจอร์รุ่นใหม่แล้ว โดยไม่ต้องติดตั้ง APK ใหม่", duration: 5000 });
    }
    const platform = /Android/i.test(navigator.userAgent) ? "android" : "web";
    void reportVersion.mutateAsync({ clientId: getClientId(), appVersion: currentVersion, platform }).catch(() => undefined);
    const check = async () => {
      try {
        const response = await fetch(`/app-version.json?notify=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) return;
        const info = await response.json() as VersionInfo;
        if (cancelled || info.latestVersion === currentVersion) return;
        const install = await verifyInstalledApp(info.signatureSha256);
        if (cancelled) return;
        const notified = localStorage.getItem("version-notified");
        if (notified === info.latestVersion) return;
        localStorage.setItem("version-notified", info.latestVersion);
        const needsUninstall = info.requiresUninstall === true || install.signatureMatches === false;
        toast(`มีเวอร์ชันใหม่ ${info.latestVersion}`, {
          description: needsUninstall
            ? "ลายเซ็นรุ่นเดิมไม่ตรงกัน กรุณาสำรองข้อมูลและถอนการติดตั้งรุ่นเดิมก่อนลงรุ่นใหม่"
            : "ตรวจสอบลายเซ็นแล้ว กดอัปเดตเพื่อดาวน์โหลด APK",
          duration: 12000,
          action: info.downloadUrl ? { label: needsUninstall ? "ดูวิธีติดตั้ง" : "อัปเดตทันที", onClick: () => { window.location.href = "/about"; } } : { label: "ดูรายละเอียด", onClick: () => { window.location.href = "/about"; } },
        });
      } catch {
        // Version checks are best-effort and should never block the app.
      }
    };
    void check();
    return () => { cancelled = true; };
  }, [reportVersion]);
  return null;
}
