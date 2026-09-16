import { useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronDown, Download, Home, Info, Mail, Share2, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

const appVersion = "1.0.0";
const androidVersion = "1.0";
const releaseDate = "16 กันยายน 2569";

type VersionInfo = { latestVersion: string; androidVersion: string; releaseDate: string; downloadUrl: string | null };

const updateHistory = [
  { version: "1.0.0", date: "16 กันยายน 2569", title: "เปิดตัวบ้านเรา", items: ["ส่งออกสรุปรายจ่ายเป็น JPG", "อ่านบิล PDF/JPG และ QR Code/Barcode", "แก้ไข ลบ ดูประวัติ และคิวอัปโหลดออฟไลน์", "รองรับ Android จอเล็ก แท็บเล็ต และแนวนอน"] },
  { version: "0.9.0", date: "10 กันยายน 2569", title: "ปรับปรุงการอ่านบิล", items: ["เพิ่มการอ่านบิลค่าเน็ตบ้าน AIS", "เติมเลขอ้างอิงและหมายเหตุจาก QR/Barcode อัตโนมัติ"] },
  { version: "0.8.0", date: "5 กันยายน 2569", title: "เริ่มต้นระบบจัดการรายจ่าย", items: ["เพิ่มรายการรายจ่ายและหมวดหมู่", "ดูยอดรวมและสัดส่วนรายจ่ายรายเดือน"] },
];

export default function About() {
  const recordDownloadMutation = trpc.appStats.recordDownload.useMutation();
  const { data: downloadStats } = trpc.appStats.summary.useQuery();
  const [versionStatus, setVersionStatus] = useState<"idle" | "checking" | "latest" | "available" | "error">("idle");
  const [latestInfo, setLatestInfo] = useState<VersionInfo | null>(null);
  const [expandedVersion, setExpandedVersion] = useState(appVersion);
  const [downloadHistory, setDownloadHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("apk-download-history") ?? "[]") as string[]; } catch { return []; }
  });

  const checkForUpdates = async () => {
    setVersionStatus("checking");
    try {
      const response = await fetch(`/app-version.json?ts=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("version check failed");
      const info = await response.json() as VersionInfo;
      setLatestInfo(info);
      setVersionStatus(info.latestVersion === appVersion ? "latest" : "available");
    } catch {
      setVersionStatus("error");
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
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/10 p-3"><p className="text-xs text-white/60">เวอร์ชันแอป</p><p className="font-numeric mt-1 text-xl">{appVersion}</p></div><div className="rounded-2xl bg-white/10 p-3"><p className="text-xs text-white/60">Android</p><p className="font-numeric mt-1 text-xl">{androidVersion}</p></div><div className="col-span-2 rounded-2xl bg-white/10 p-3 sm:col-span-1"><p className="text-xs text-white/60">อัปเดตล่าสุด</p><p className="mt-1 text-sm">{releaseDate}</p></div></div>
        </section>

        <section className="mt-5 rounded-[26px] border border-[#E5E3DC] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-[#B18A36]" /><h2 className="font-display text-xl">ตรวจสอบเวอร์ชันใหม่</h2></div><button type="button" onClick={checkForUpdates} disabled={versionStatus === "checking"} className="rounded-xl bg-[#2F6F68] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#275E58] disabled:opacity-60">{versionStatus === "checking" ? "กำลังตรวจสอบ..." : "ตรวจสอบตอนนี้"}</button></div>
          <p className="mt-3 text-sm text-[#777D78]">ตรวจจากข้อมูลเวอร์ชันล่าสุดของแอป โดยไม่ต้องออกจากหน้านี้</p>
          {versionStatus === "latest" && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#E7EFE9] px-3 py-2 text-sm text-[#2F6F68]"><span>คุณใช้เวอร์ชันล่าสุดแล้ว ({latestInfo?.latestVersion})</span>{latestInfo?.downloadUrl && <div className="flex gap-2"><a href={latestInfo.downloadUrl} download onClick={recordDownload} className="inline-flex items-center gap-2 rounded-lg bg-[#2F6F68] px-3 py-2 text-xs font-medium text-white hover:bg-[#275E58]"><Download className="h-3.5 w-3.5" />ดาวน์โหลด APK</a><button type="button" onClick={shareDownloadLink} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-[#2F6F68] hover:bg-[#F7F5EF]"><Share2 className="h-3.5 w-3.5" />แชร์</button></div>}</div>}
          {versionStatus === "available" && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#FFF4D9] px-3 py-2 text-sm text-[#8B6C2B]"><span>มีเวอร์ชันใหม่ {latestInfo?.latestVersion}</span>{latestInfo?.downloadUrl ? <div className="flex gap-2"><a href={latestInfo.downloadUrl} download onClick={recordDownload} className="inline-flex items-center gap-2 rounded-lg bg-[#2F6F68] px-3 py-2 text-xs font-medium text-white hover:bg-[#275E58]"><Download className="h-3.5 w-3.5" />ดาวน์โหลด APK</a><button type="button" onClick={shareDownloadLink} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-[#2F6F68] hover:bg-[#FFF9E9]"><Share2 className="h-3.5 w-3.5" />แชร์</button></div> : <span className="text-xs">รอลิงก์ดาวน์โหลดจากผู้ดูแล</span>}</div>}
          {versionStatus === "error" && <p className="mt-4 rounded-xl bg-[#FFF0EF] px-3 py-2 text-sm text-[#9B5550]">ตรวจสอบไม่ได้ในขณะนี้ กรุณาลองใหม่เมื่อออนไลน์</p>}
        </section>

        <section className="mt-5 rounded-[26px] border border-[#D6E2D9] bg-[#E7EFE9] p-5 shadow-sm sm:p-7"><div className="flex items-center justify-between gap-3"><h2 className="font-display text-xl">สถิติการดาวน์โหลด</h2><span className="text-xs text-[#8C908B]">ข้อมูลรวมจากระบบ</span></div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white/70 p-3"><p className="text-xs text-[#71857B]">ดาวน์โหลดทั้งหมด</p><p className="font-numeric mt-1 text-2xl font-semibold text-[#2F6F68]">{downloadStats?.totalDownloads ?? 0}</p></div><div className="rounded-2xl bg-[#FCF3D8] p-3"><p className="text-xs text-[#8B6C2B]">เวอร์ชันปัจจุบัน</p><p className="font-numeric mt-1 text-2xl font-semibold text-[#8B6C2B]">{appVersion}</p></div></div>{downloadStats?.byVersion.length ? <ul className="mt-4 space-y-2 text-sm text-[#52645D]">{downloadStats.byVersion.map(item => <li key={item.version} className="flex justify-between rounded-xl bg-[#FCFBF7] px-3 py-2"><span>ดาวน์โหลด v{item.version}</span><strong>{item.downloads} ครั้ง</strong></li>)}</ul> : null}<div className="mt-4 border-t border-[#D6E2D9] pt-4"><p className="text-xs text-[#71857B]">เวอร์ชันที่ผู้ใช้กำลังใช้งานในช่วง 30 วัน</p>{downloadStats?.activeByVersion?.length ? <ul className="mt-2 space-y-2 text-sm text-[#52645D]">{downloadStats.activeByVersion.map(item => <li key={item.version} className="flex justify-between rounded-xl bg-white/70 px-3 py-2"><span>v{item.version}</span><strong>{item.users} ผู้ใช้</strong></li>)}</ul> : <p className="mt-2 text-sm text-[#8C908B]">ยังไม่มีข้อมูลการใช้งาน</p>}</div></section>
        <section className="mt-5 rounded-[26px] border border-[#E5E3DC] bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center justify-between gap-3"><h2 className="font-display text-xl">ประวัติการดาวน์โหลด APK</h2><span className="text-xs text-[#8C908B]">เก็บไว้ในอุปกรณ์นี้</span></div>{downloadHistory.length ? <ul className="mt-4 space-y-2 text-sm text-[#52645D]">{downloadHistory.map((item, index) => <li key={`${item}-${index}`} className="rounded-xl bg-[#FCFBF7] px-3 py-2">ดาวน์โหลดเมื่อ {item}</li>)}</ul> : <p className="mt-3 text-sm text-[#8C908B]">ยังไม่มีประวัติการดาวน์โหลด</p>}</section>

        <section className="mt-5 rounded-[26px] border border-[#E5E3DC] bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-[#B18A36]" /><h2 className="font-display text-xl">ประวัติการอัปเดต</h2></div><div className="mt-5 space-y-3">{updateHistory.map(update => <div key={update.version} className="rounded-2xl border border-[#ECE9E1] bg-[#FCFBF7] p-4"><button type="button" onClick={() => setExpandedVersion(expandedVersion === update.version ? "" : update.version)} className="flex w-full items-center justify-between gap-3 text-left"><span><span className="font-numeric font-semibold text-[#2F6F68]">v{update.version}</span><span className="ml-2 text-xs text-[#8C908B]">{update.date}</span><span className="block mt-1 font-medium">{update.title}</span></span><ChevronDown className={`h-4 w-4 shrink-0 text-[#71857B] transition-transform ${expandedVersion === update.version ? "rotate-180" : ""}`} /></button>{expandedVersion === update.version && <ul className="mt-3 space-y-2 border-t border-[#ECE9E1] pt-3 text-sm leading-6 text-[#52645D]">{update.items.map(item => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#4E9A78]" />{item}</li>)}</ul>}</div>)}</div></section>

        <section className="mt-5 rounded-[26px] border border-[#D6E2D9] bg-[#E7EFE9] p-5 sm:p-7"><div className="flex items-center gap-3"><UserRound className="h-5 w-5 text-[#2F6F68]" /><h2 className="font-display text-xl">ผู้พัฒนาและช่องทางติดต่อ</h2></div><p className="mt-3 text-sm leading-6 text-[#61726B]"><strong className="font-semibold text-[#31534D]">ผู้พัฒนาบ้านเรา:</strong> Oomyim Pimjai<br /><strong className="font-semibold text-[#31534D]">ช่องทางติดต่อ:</strong> Messenger</p><a href="https://m.me/OomYimPimJai888" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs text-[#2F6F68] hover:bg-white"><Mail className="h-4 w-4" /> ติดต่อ Oomyim Pimjai</a></section>
        <section className="mt-5 rounded-[26px] border border-[#D6E2D9] bg-[#E7EFE9] p-5 sm:p-7"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-[#2F6F68]" /><h2 className="font-display text-xl">การใช้งานและความเป็นส่วนตัว</h2></div><p className="mt-3 text-sm leading-6 text-[#61726B]">ข้อมูลรายจ่ายและบิลของคุณใช้สำหรับการจัดการภายในแอปตามบัญชีผู้ใช้งาน การประมวลผลบิลจะทำเมื่อคุณเลือกอัปโหลด และคุณสามารถแก้ไขหรือลบรายการได้ภายหลัง</p><div className="mt-4 flex flex-wrap gap-2"><Link href="/terms" className="rounded-xl bg-white/70 px-3 py-2 text-xs text-[#2F6F68] hover:bg-white">เงื่อนไขการใช้งาน</Link><Link href="/privacy" className="rounded-xl bg-white/70 px-3 py-2 text-xs text-[#2F6F68] hover:bg-white">นโยบายความเป็นส่วนตัว</Link></div></section>
        <p className="mt-6 text-center text-xs text-[#8C908B]">บ้านเรา · Home Expenses · เวอร์ชัน {appVersion}</p>
      </div>
    </main>
  );
}
