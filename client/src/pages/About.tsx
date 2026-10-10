import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronDown, Download, Home, Info, Mail, RefreshCw, Share2, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { verifyInstalledApp, type InstallVerification } from "@/lib/app-install-verifier";

const appVersion = "1.0.13";
const androidVersion = "1.0.13";
const releaseDate = "10 ตุลาคม 2569";

type VersionInfo = { latestVersion: string; androidVersion: string; releaseDate: string; downloadUrl: string | null; signatureSha256?: string | null; requiresUninstall?: boolean };
type WebUpdateRecord = { version: string; loadedAt: string };

const updateHistory = [
  { version: "1.0.13", date: "10 ตุลาคม 2569", title: "แสดงสถานะการบันทึกชัดเจนขึ้น", items: ["เพิ่มแอนิเมชันและข้อความระหว่างกำลังบันทึกรายจ่าย", "เพิ่ม Success Toast หลังบันทึกหรือแก้ไขข้อมูลสำเร็จ", "ปรับฟอร์ม Android ไม่ให้ปุ่มบันทึกทับช่องรายละเอียด"] },
  { version: "1.0.12", date: "9 ตุลาคม 2569", title: "สร้างรายการรายเดือนอัตโนมัติและปรับหน้าจอ Android", items: ["สร้างรายการเดือนถัดไปจากรายการที่ตั้งรอบชำระทุกเดือนโดยอัตโนมัติ", "ป้องกันการสร้างรายการซ้ำแม้เปิดแอปหรือเปลี่ยนเดือนหลายครั้ง", "ปรับการ์ดหน้า Home ให้กระชับและพอดีกับจอมือถือ"] },
  { version: "1.0.11", date: "8 ตุลาคม 2569", title: "ตั้งรอบชำระซ้ำรายเดือน", items: ["เพิ่มตัวเลือกไม่ทำซ้ำหรือทุกเดือนในฟอร์มรายจ่าย", "บันทึกวันกำหนดชำระแยกจากหมายเหตุและรองรับออฟไลน์", "แสดงป้ายทุกเดือนในรายการที่ตั้งรอบชำระซ้ำ"] },
  { version: "1.0.10", date: "3 ตุลาคม 2569", title: "กรอกวันกำหนดชำระอัตโนมัติ", items: ["เปลี่ยนช่องวันครบรอบกำหนดชำระเป็น date picker", "เติมวันที่รายการหรือวันที่ปัจจุบันให้อัตโนมัติ และยังแก้ไขได้"] },
  { version: "1.0.9", date: "3 ตุลาคม 2569", title: "จัดการประวัติเว็บอัตโนมัติ", items: ["ล้างประวัติเว็บรุ่นที่เก่ากว่า 90 วันโดยอัตโนมัติ", "เปลี่ยนหัวข้อช่องบันทึกรายการใหม่เป็นวันครบรอบกำหนดชำระ"] },
  { version: "1.0.8", date: "3 ตุลาคม 2569", title: "ยกเลิกและเร่งการอัปโหลดบิล", items: ["เพิ่มปุ่มยกเลิกการอัปโหลดระหว่างส่งไฟล์", "บีบอัดรูปบิลอัตโนมัติเป็น JPG ขนาดเหมาะสมก่อนอัปโหลด", "บันทึกประวัติเครดิตเว็บรุ่นที่โหลดสำเร็จพร้อมวันเวลาในอุปกรณ์"] },
  { version: "1.0.7", date: "2 ตุลาคม 2569", title: "แสดง progress อัปโหลดแบบละเอียด", items: ["เพิ่มเปอร์เซ็นต์จาก XMLHttpRequest upload progress จริง", "เพิ่ม toast แจ้งเมื่อเว็บรุ่นใหม่โหลดสำเร็จ", "ปรับสถานะการอัปโหลดให้เห็นช่วงเตรียมไฟล์ ส่งไฟล์ และบันทึกรายจ่าย"] },
  { version: "1.0.6", date: "2 ตุลาคม 2569", title: "อัปเดตอัตโนมัติและปรับจอ Android", items: ["เว็บภายใน APK อัปเดตอัตโนมัติผ่าน Service Worker โดยไม่ต้องติดตั้ง APK ใหม่", "เพิ่ม progress ระหว่างเตรียมและอัปโหลดบิลขนาดใหญ่", "เพิ่มปุ่มลองตรวจลายเซ็นอีกครั้ง และเว้นพื้นที่ navigation bar ให้หน้า Android"] },
  { version: "1.0.5", date: "1 ตุลาคม 2569", title: "อัปเดตปลอดภัยและบันทึกรายจ่ายเร็วขึ้น", items: ["ตรวจลายเซ็น APK และสถานะการติดตั้งก่อนแจ้งเตือนอัปเดต", "แสดงคำเตือนหากต้องถอนรุ่นเดิมก่อนติดตั้ง", "เพิ่ม animation ขณะปัดปิด bottom sheet และลดเวลารอบันทึกรายจ่าย"] },
  { version: "1.0.4", date: "17 กันยายน 2569", title: "เพิ่มการควบคุม popup และตรวจเวอร์ชันจริง", items: ["ปัดลงจากแถบจับเพื่อปิด bottom sheet", "โฟกัสและเลื่อนไปยังช่องที่กรอกไม่ครบอัตโนมัติ", "อ่านเวอร์ชัน Android จริงจาก native Capacitor App plugin"] },
  { version: "1.0.3", date: "17 กันยายน 2569", title: "ปรับ popup ให้พ้นปุ่ม Home", items: ["ลดความสูง popup เพิ่มพื้นที่ด้านล่างสำหรับ Android Navigation Bar", "ยก bottom sheet ขึ้นจากปุ่ม Home และคงการเลื่อนฟอร์มภายใน"] },
  { version: "1.0.2", date: "17 กันยายน 2569", title: "ปรับประสบการณ์ใช้งาน Android", items: ["ปรับหน้าเพิ่มรายจ่ายเป็น bottom sheet ใช้งานมือเดียวได้สะดวกขึ้น", "ซ่อนปุ่มติดตั้งเมื่อเปิดจาก Android native หรือแอปที่ติดตั้งแล้ว", "เพิ่มข้อความ Home Expenses By Oomyim Pimjai ที่ท้ายหน้า"] },
  { version: "1.0.1", date: "16 กันยายน 2569", title: "ปรับหน้าจอ Android", items: ["ลดระยะขอบและความสูงการ์ดสำหรับจอ 360×800 และ 412×915", "ปรับขนาดยอดเงิน ปุ่ม และรายการล่าสุดให้พอดีกับจอแคบ", "คงเลย์เอาต์แท็บเล็ตและเดสก์ท็อปเดิม"] },
  { version: "1.0.0", date: "16 กันยายน 2569", title: "เปิดตัวบ้านเรา", items: ["ส่งออกสรุปรายจ่ายเป็น JPG", "อ่านบิล PDF/JPG และ QR Code/Barcode", "แก้ไข ลบ ดูประวัติ และคิวอัปโหลดออฟไลน์", "รองรับ Android จอเล็ก แท็บเล็ต และแนวนอน"] },
  { version: "0.9.0", date: "10 กันยายน 2569", title: "ปรับปรุงการอ่านบิล", items: ["เพิ่มการอ่านบิลค่าเน็ตบ้าน AIS", "เติมเลขอ้างอิงและหมายเหตุจาก QR/Barcode อัตโนมัติ"] },
  { version: "0.8.0", date: "5 กันยายน 2569", title: "เริ่มต้นระบบจัดการรายจ่าย", items: ["เพิ่มรายการรายจ่ายและหมวดหมู่", "ดูยอดรวมและสัดส่วนรายจ่ายรายเดือน"] },
];

export default function About() {
  const recordDownloadMutation = trpc.appStats.recordDownload.useMutation();
  const { data: downloadStats } = trpc.appStats.summary.useQuery();
  const [versionStatus, setVersionStatus] = useState<"idle" | "checking" | "latest" | "available" | "error">("idle");
  const [latestInfo, setLatestInfo] = useState<VersionInfo | null>(null);
  const [installedVersion, setInstalledVersion] = useState<string | null>(null);
  const [installVerification, setInstallVerification] = useState<InstallVerification | null>(null);
  const [signatureChecking, setSignatureChecking] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState(appVersion);
  const [downloadHistory, setDownloadHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("apk-download-history") ?? "[]") as string[]; } catch { return []; }
  });
  const [webUpdateHistory] = useState<WebUpdateRecord[]>(() => {
    try {
      const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
      const saved = JSON.parse(localStorage.getItem("baan-rao-web-update-history") ?? "[]") as WebUpdateRecord[];
      const fresh = saved.filter(item => item && typeof item.version === "string" && Date.parse(item.loadedAt) >= cutoff).slice(0, 10);
      localStorage.setItem("baan-rao-web-update-history", JSON.stringify(fresh));
      return fresh;
    } catch { localStorage.removeItem("baan-rao-web-update-history"); return []; }
  });

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void CapacitorApp.getInfo().then(info => setInstalledVersion(info.version)).catch(() => undefined);
    void verifyInstalledApp("77A3DEFEF0FF1C23DEA09058C5CC41390DC0DF60ABB3311BE58A96022E4F1D28").then(setInstallVerification);
  }, []);

  const checkForUpdates = async () => {
    setVersionStatus("checking");
    try {
      const response = await fetch(`/app-version.json?ts=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("version check failed");
      const info = await response.json() as VersionInfo;
      setLatestInfo(info);
      setInstallVerification(await verifyInstalledApp(info.signatureSha256));
      setVersionStatus(info.latestVersion === appVersion ? "latest" : "available");
    } catch {
      setVersionStatus("error");
    }
  };

  const retrySignatureCheck = async () => {
    setSignatureChecking(true);
    try {
      setInstallVerification(await verifyInstalledApp(latestInfo?.signatureSha256 ?? "77A3DEFEF0FF1C23DEA09058C5CC41390DC0DF60ABB3311BE58A96022E4F1D28"));
    } finally {
      setSignatureChecking(false);
    }
  };

  const recordDownload = () => {
    const next = [new Date().toLocaleString("th-TH"), ...downloadHistory].slice(0, 5);
    setDownloadHistory(next);
    localStorage.setItem("apk-download-history", JSON.stringify(next));
    recordDownloadMutation.mutate({ appVersion, platform: /Android/i.test(navigator.userAgent) ? "android" : "web" });
  };

  const shareDownloadLink = async () => {
    let url = latestInfo?.downloadUrl;
    if (!url) {
      try {
        const response = await fetch(`/app-version.json?share=${Date.now()}`, { cache: "no-store" });
        const info = await response.json() as VersionInfo;
        setLatestInfo(info);
        url = info.downloadUrl;
      } catch { /* handled by the fallback message below */ }
    }
    if (!url) return;
    const shareData = { title: "บ้านเรา | Home Expenses", text: `ดาวน์โหลดแอปบ้านเรา เวอร์ชัน ${appVersion}`, url };
    try {
      if (navigator.share) await navigator.share(shareData);
      else { await navigator.clipboard.writeText(url); window.alert("คัดลอกลิงก์ดาวน์โหลดแล้ว"); }
    } catch { /* user cancelled share */ }
  };

  return (
    <main className="min-h-[100dvh] bg-[#F7F5EF] px-4 py-5 text-[#242C2A] sm:px-6 md:px-10 md:py-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-[#2F6F68] transition-colors hover:bg-white"><ArrowLeft className="h-4 w-4" /> กลับหน้าหลัก</Link>
          <Link href="/" aria-label="หน้าหลัก" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2F6F68] text-white shadow-lg shadow-[#2F6F68]/15"><Home className="h-5 w-5" /></Link>
        </header>

        <section className="overflow-hidden rounded-[30px] bg-[#2F6F68] p-6 text-white shadow-xl shadow-[#2F6F68]/15 sm:p-8">
          <div className="flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15"><Info className="h-7 w-7" /></div><div><p className="text-sm tracking-[0.14em] text-white/65">ABOUT THE APP</p><h1 className="font-display mt-1 text-3xl font-semibold">เกี่ยวกับบ้านเรา</h1><p className="mt-2 text-sm leading-6 text-white/75">ผู้ช่วยจัดการรายจ่ายในบ้านให้เป็นเรื่องง่าย อ่านบิล เก็บรายการ และดูภาพรวมได้ในที่เดียว</p></div></div>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/10 p-3"><p className="text-xs text-white/60">เวอร์ชันแอป</p><p className="font-numeric mt-1 text-xl">{appVersion}</p></div><div className="rounded-2xl bg-white/10 p-3"><p className="text-xs text-white/60">Android</p><p className="font-numeric mt-1 text-xl">{installedVersion ?? androidVersion}</p>{installedVersion && <p className="mt-1 text-[10px] text-white/60">เวอร์ชันติดตั้งจริง</p>}</div><div className="col-span-2 rounded-2xl bg-white/10 p-3 sm:col-span-1"><p className="text-xs text-white/60">อัปเดตล่าสุด</p><p className="mt-1 text-sm">{releaseDate}</p></div></div>
        </section>

        <section className="mt-5 rounded-[26px] border border-[#E5E3DC] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-[#B18A36]" /><h2 className="font-display text-xl">ตรวจสอบเวอร์ชันใหม่</h2></div><button type="button" onClick={checkForUpdates} disabled={versionStatus === "checking"} className="rounded-xl bg-[#2F6F68] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#275E58] disabled:opacity-60">{versionStatus === "checking" ? "กำลังตรวจสอบ..." : "ตรวจสอบตอนนี้"}</button></div>
          <p className="mt-3 text-sm text-[#777D78]">เว็บภายในแอปจะอัปเดตอัตโนมัติเมื่อมีรุ่นใหม่ โดยไม่ต้องติดตั้ง APK ใหม่ ส่วนตัวแอป Android ต้องติดตั้งผ่านระบบ Android หรือ Play Store ตามข้อจำกัดความปลอดภัย</p>
          {Capacitor.isNativePlatform() && <div className="mt-3 flex flex-wrap items-center gap-2"><button type="button" onClick={retrySignatureCheck} disabled={signatureChecking} className="inline-flex items-center gap-2 rounded-lg border border-[#D6E2D9] bg-white px-3 py-2 text-xs font-medium text-[#2F6F68] hover:bg-[#F5FAF6] disabled:opacity-60"><RefreshCw className={`h-3.5 w-3.5 ${signatureChecking ? "animate-spin" : ""}`} />{signatureChecking ? "กำลังตรวจลายเซ็น..." : "ลองตรวจลายเซ็นอีกครั้ง"}</button>{installVerification?.signatureMatches === true && <span className="text-xs text-[#4E8B6B]">ลายเซ็นตรงกับรุ่นที่เผยแพร่</span>}{installVerification?.signatureMatches === false && <span className="text-xs text-[#9B5550]">ลายเซ็นไม่ตรงกัน</span>}</div>}
          {versionStatus === "latest" && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#E7EFE9] px-3 py-2 text-sm text-[#2F6F68]"><span>คุณใช้เวอร์ชันล่าสุดแล้ว ({latestInfo?.latestVersion})</span>{latestInfo?.downloadUrl && <div className="flex gap-2"><a href={latestInfo.downloadUrl} download onClick={recordDownload} className="inline-flex items-center gap-2 rounded-lg bg-[#2F6F68] px-3 py-2 text-xs font-medium text-white hover:bg-[#275E58]"><Download className="h-3.5 w-3.5" />ดาวน์โหลด APK</a><button type="button" onClick={shareDownloadLink} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-[#2F6F68] hover:bg-[#F7F5EF]"><Share2 className="h-3.5 w-3.5" />แชร์</button></div>}</div>}
          {versionStatus === "available" && <div className="mt-4 rounded-xl bg-[#FFF4D9] px-3 py-3 text-sm text-[#8B6C2B]"><div className="flex flex-wrap items-center justify-between gap-3"><span>มีเวอร์ชันใหม่ {latestInfo?.latestVersion}</span>{latestInfo?.downloadUrl ? <div className="flex gap-2"><a href={latestInfo.downloadUrl} download onClick={recordDownload} className="inline-flex items-center gap-2 rounded-lg bg-[#2F6F68] px-3 py-2 text-xs font-medium text-white hover:bg-[#275E58]"><Download className="h-3.5 w-3.5" />ดาวน์โหลด APK</a><button type="button" onClick={shareDownloadLink} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-[#2F6F68] hover:bg-[#FFF9E9]"><Share2 className="h-3.5 w-3.5" />แชร์</button></div> : <span className="text-xs">รอลิงก์ดาวน์โหลดจากผู้ดูแล</span>}</div>{(latestInfo?.requiresUninstall || installVerification?.signatureMatches === false || installVerification?.warning) && <p className="mt-3 rounded-lg bg-[#FFF0EF] px-3 py-2 text-xs leading-5 text-[#9B5550]">ลายเซ็น APK ไม่ตรงกับรุ่นที่ติดตั้งอยู่ อาจต้องสำรองข้อมูลและถอนการติดตั้งรุ่นเดิมก่อนติดตั้งรุ่นใหม่</p>}</div>}
          {versionStatus === "error" && <p className="mt-4 rounded-xl bg-[#FFF0EF] px-3 py-2 text-sm text-[#9B5550]">ตรวจสอบไม่ได้ในขณะนี้ กรุณาลองใหม่เมื่อออนไลน์</p>}
        </section>

        <section className="mt-5 rounded-[26px] border border-[#D6E2D9] bg-[#E7EFE9] p-5 shadow-sm sm:p-7"><div className="flex items-center justify-between gap-3"><h2 className="font-display text-xl">สถิติการดาวน์โหลด</h2><span className="text-xs text-[#8C908B]">ข้อมูลรวมจากระบบ</span></div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white/70 p-3"><p className="text-xs text-[#71857B]">ดาวน์โหลดทั้งหมด</p><p className="font-numeric mt-1 text-2xl font-semibold text-[#2F6F68]">{downloadStats?.totalDownloads ?? 0}</p></div><div className="rounded-2xl bg-[#FCF3D8] p-3"><p className="text-xs text-[#8B6C2B]">เวอร์ชันปัจจุบัน</p><p className="font-numeric mt-1 text-2xl font-semibold text-[#8B6C2B]">{appVersion}</p></div></div>{downloadStats?.byVersion.length ? <ul className="mt-4 space-y-2 text-sm text-[#52645D]">{downloadStats.byVersion.map(item => <li key={item.version} className="flex justify-between rounded-xl bg-[#FCFBF7] px-3 py-2"><span>ดาวน์โหลด v{item.version}</span><strong>{item.downloads} ครั้ง</strong></li>)}</ul> : null}<div className="mt-4 border-t border-[#D6E2D9] pt-4"><p className="text-xs text-[#71857B]">เวอร์ชันที่ผู้ใช้กำลังใช้งานในช่วง 30 วัน</p>{downloadStats?.activeByVersion?.length ? <ul className="mt-2 space-y-2 text-sm text-[#52645D]">{downloadStats.activeByVersion.map(item => <li key={item.version} className="flex justify-between rounded-xl bg-white/70 px-3 py-2"><span>v{item.version}</span><strong>{item.users} ผู้ใช้</strong></li>)}</ul> : <p className="mt-2 text-sm text-[#8C908B]">ยังไม่มีข้อมูลการใช้งาน</p>}</div></section>
        <section className="mt-5 rounded-[26px] border border-[#E5E3DC] bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center justify-between gap-3"><h2 className="font-display text-xl">ประวัติการดาวน์โหลด APK</h2><span className="text-xs text-[#8C908B]">เก็บไว้ในอุปกรณ์นี้</span></div>{downloadHistory.length ? <ul className="mt-4 space-y-2 text-sm text-[#52645D]">{downloadHistory.map((item, index) => <li key={`${item}-${index}`} className="rounded-xl bg-[#FCFBF7] px-3 py-2">ดาวน์โหลดเมื่อ {item}</li>)}</ul> : <p className="mt-3 text-sm text-[#8C908B]">ยังไม่มีประวัติการดาวน์โหลด</p>}</section>

        <section className="mt-5 rounded-[26px] border border-[#D6E2D9] bg-[#E7EFE9] p-5 shadow-sm sm:p-7"><div className="flex items-center justify-between gap-3"><h2 className="font-display text-xl">ประวัติการอัปเดตเว็บ</h2><span className="text-xs text-[#71857B]">เก็บไว้ในอุปกรณ์นี้</span></div>{webUpdateHistory.length ? <ul className="mt-4 space-y-2 text-sm text-[#52645D]">{webUpdateHistory.map((item, index) => <li key={`${item.version}-${item.loadedAt}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2"><span>โหลดเว็บรุ่น <strong className="font-numeric text-[#2F6F68]">v{item.version}</strong> สำเร็จ</span><time className="shrink-0 text-xs text-[#71857B]">{new Date(item.loadedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</time></li>)}</ul> : <p className="mt-3 text-sm text-[#8C908B]">ยังไม่มีประวัติการอัปเดตเว็บ</p>}</section>

        <section className="mt-5 rounded-[26px] border border-[#E5E3DC] bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-[#B18A36]" /><h2 className="font-display text-xl">ประวัติการอัปเดต</h2></div><div className="mt-5 space-y-3">{updateHistory.map(update => <div key={update.version} className="rounded-2xl border border-[#ECE9E1] bg-[#FCFBF7] p-4"><button type="button" onClick={() => setExpandedVersion(expandedVersion === update.version ? "" : update.version)} className="flex w-full items-center justify-between gap-3 text-left"><span><span className="font-numeric font-semibold text-[#2F6F68]">v{update.version}</span><span className="ml-2 text-xs text-[#8C908B]">{update.date}</span><span className="block mt-1 font-medium">{update.title}</span></span><ChevronDown className={`h-4 w-4 shrink-0 text-[#71857B] transition-transform ${expandedVersion === update.version ? "rotate-180" : ""}`} /></button>{expandedVersion === update.version && <ul className="mt-3 space-y-2 border-t border-[#ECE9E1] pt-3 text-sm leading-6 text-[#52645D]">{update.items.map(item => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#4E9A78]" />{item}</li>)}</ul>}</div>)}</div></section>

        <section className="mt-5 rounded-[26px] border border-[#D6E2D9] bg-[#E7EFE9] p-5 sm:p-7"><div className="flex items-center gap-3"><UserRound className="h-5 w-5 text-[#2F6F68]" /><h2 className="font-display text-xl">ผู้พัฒนาและช่องทางติดต่อ</h2></div><p className="mt-3 text-sm leading-6 text-[#61726B]"><strong className="font-semibold text-[#31534D]">ผู้พัฒนาบ้านเรา:</strong> Oomyim Pimjai<br /><strong className="font-semibold text-[#31534D]">ช่องทางติดต่อ:</strong> Messenger</p><a href="https://m.me/OomYimPimJai888" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs text-[#2F6F68] hover:bg-white"><Mail className="h-4 w-4" /> ติดต่อ Oomyim Pimjai</a></section>
        <section className="mt-5 rounded-[26px] border border-[#D6E2D9] bg-[#E7EFE9] p-5 sm:p-7"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-[#2F6F68]" /><h2 className="font-display text-xl">การใช้งานและความเป็นส่วนตัว</h2></div><p className="mt-3 text-sm leading-6 text-[#61726B]">ข้อมูลรายจ่ายและบิลของคุณใช้สำหรับการจัดการภายในแอปตามบัญชีผู้ใช้งาน การประมวลผลบิลจะทำเมื่อคุณเลือกอัปโหลด และคุณสามารถแก้ไขหรือลบรายการได้ภายหลัง</p><div className="mt-4 flex flex-wrap gap-2"><Link href="/terms" className="rounded-xl bg-white/70 px-3 py-2 text-xs text-[#2F6F68] hover:bg-white">เงื่อนไขการใช้งาน</Link><Link href="/privacy" className="rounded-xl bg-white/70 px-3 py-2 text-xs text-[#2F6F68] hover:bg-white">นโยบายความเป็นส่วนตัว</Link></div></section>
        <p className="mt-6 text-center text-xs text-[#8C908B]">บ้านเรา · Home Expenses · เวอร์ชัน {appVersion}</p>
      </div>
    </main>
  );
}
