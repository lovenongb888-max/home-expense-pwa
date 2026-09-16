import { useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const currentVersion = "1.0.1";

type VersionInfo = { latestVersion: string; downloadUrl: string | null };

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
    const platform = /Android/i.test(navigator.userAgent) ? "android" : "web";
    void reportVersion.mutateAsync({ clientId: getClientId(), appVersion: currentVersion, platform }).catch(() => undefined);
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
          description: "กดอัปเดตเพื่อดาวน์โหลด APK แล้วให้ Android ดำเนินการติดตั้ง",
          duration: 12000,
          action: info.downloadUrl ? { label: "อัปเดตทันที", onClick: () => { window.location.href = info.downloadUrl!; } } : { label: "ดูรายละเอียด", onClick: () => { window.location.href = "/about"; } },
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
