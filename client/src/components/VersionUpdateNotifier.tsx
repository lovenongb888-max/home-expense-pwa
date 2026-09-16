import { useEffect } from "react";
import { toast } from "sonner";

const currentVersion = "1.0.0";

type VersionInfo = { latestVersion: string; downloadUrl: string | null };

export default function VersionUpdateNotifier() {
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const response = await fetch(`/app-version.json?notify=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) return;
        const info = await response.json() as VersionInfo;
        if (cancelled || info.latestVersion === currentVersion) return;
        const notified = localStorage.getItem("version-notified");
        if (notified === info.latestVersion) return;
        localStorage.setItem("version-notified", info.latestVersion);
        toast(`มีเวอร์ชันใหม่ ${info.latestVersion}`, {
          description: "เปิดหน้าเกี่ยวกับแอปเพื่อดูรายละเอียดและดาวน์โหลด APK",
          duration: 9000,
          action: { label: "ดูรายละเอียด", onClick: () => { window.location.href = "/about"; } },
        });
      } catch {
        // Version checks are best-effort and should never block the app.
      }
    };
    void check();
    return () => { cancelled = true; };
  }, []);
  return null;
}
