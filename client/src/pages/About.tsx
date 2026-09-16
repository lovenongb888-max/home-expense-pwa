import { useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronDown, Home, Info, Mail, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Link } from "wouter";

const appVersion = "1.0.0";
const androidVersion = "1.0";
const releaseDate = "15 กันยายน 2569";

type VersionInfo = { latestVersion: string; androidVersion: string; releaseDate: string; downloadUrl: string | null };

const updateHistory = [
  { version: "1.0.0", date: "15 กันยายน 2569", title: "เปิดตัวบ้านเรา", items: ["ส่งออกสรุปรายจ่ายเป็น JPG", "อ่านบิล PDF/JPG และ QR Code/Barcode", "แก้ไข ลบ ดูประวัติ และคิวอัปโหลดออฟไลน์", "รองรับ Android จอเล็ก แท็บเล็ต และแนวนอน"] },
  { version: "0.9.0", date: "10 กันยายน 2569", title: "ปรับปรุงการอ่านบิล", items: ["เพิ่มการอ่านบิลค่าเน็ตบ้าน AIS", "เติมเลขอ้างอิงและหมายเหตุจาก QR/Barcode อัตโนมัติ"] },
  { version: "0.8.0", date: "5 กันยายน 2569", title: "เริ่มต้นระบบจัดการรายจ่าย", items: ["เพิ่มรายการรายจ่ายและหมวดหมู่", "ดูยอดรวมและสัดส่วนรายจ่ายรายเดือน"] },
];

export default function About() {
  const [versionStatus, setVersionStatus] = useState<"idle" | "checking" | "latest" | "available" | "error">("idle");
  const [latestInfo, setLatestInfo] = useState<VersionInfo | null>(null);
  const [expandedVersion, setExpandedVersion] = useState(appVersion);

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
          {versionStatus === "latest" && <p className="mt-4 rounded-xl bg-[#E7EFE9] px-3 py-2 text-sm text-[#2F6F68]">คุณใช้เวอร์ชันล่าสุดแล้ว ({latestInfo?.latestVersion})</p>}
          {versionStatus === "available" && <p className="mt-4 rounded-xl bg-[#FFF4D9] px-3 py-2 text-sm text-[#8B6C2B]">มีเวอร์ชันใหม่ {latestInfo?.latestVersion} กรุณาดาวน์โหลด APK รุ่นล่าสุดจากผู้ดูแลแอป</p>}
          {versionStatus === "error" && <p className="mt-4 rounded-xl bg-[#FFF0EF] px-3 py-2 text-sm text-[#9B5550]">ตรวจสอบไม่ได้ในขณะนี้ กรุณาลองใหม่เมื่อออนไลน์</p>}
        </section>

        <section className="mt-5 rounded-[26px] border border-[#E5E3DC] bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-[#B18A36]" /><h2 className="font-display text-xl">ประวัติการอัปเดต</h2></div><div className="mt-5 space-y-3">{updateHistory.map(update => <div key={update.version} className="rounded-2xl border border-[#ECE9E1] bg-[#FCFBF7] p-4"><button type="button" onClick={() => setExpandedVersion(expandedVersion === update.version ? "" : update.version)} className="flex w-full items-center justify-between gap-3 text-left"><span><span className="font-numeric font-semibold text-[#2F6F68]">v{update.version}</span><span className="ml-2 text-xs text-[#8C908B]">{update.date}</span><span className="block mt-1 font-medium">{update.title}</span></span><ChevronDown className={`h-4 w-4 shrink-0 text-[#71857B] transition-transform ${expandedVersion === update.version ? "rotate-180" : ""}`} /></button>{expandedVersion === update.version && <ul className="mt-3 space-y-2 border-t border-[#ECE9E1] pt-3 text-sm leading-6 text-[#52645D]">{update.items.map(item => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#4E9A78]" />{item}</li>)}</ul>}</div>)}</div></section>

        <section className="mt-5 rounded-[26px] border border-[#D6E2D9] bg-[#E7EFE9] p-5 sm:p-7"><div className="flex items-center gap-3"><UserRound className="h-5 w-5 text-[#2F6F68]" /><h2 className="font-display text-xl">ผู้พัฒนาและช่องทางติดต่อ</h2></div><p className="mt-3 text-sm leading-6 text-[#61726B]"><strong className="font-semibold text-[#31534D]">ผู้พัฒนา:</strong> ทีมพัฒนาบ้านเรา<br /><strong className="font-semibold text-[#31534D]">ช่องทางติดต่อ:</strong> ติดต่อผู้ดูแลโปรเจกต์ผ่านระบบที่ใช้จัดการแอป</p><div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs text-[#527168]"><Mail className="h-4 w-4" /> รองรับการติดต่อผ่านผู้ดูแลโปรเจกต์</div></section>
        <section className="mt-5 rounded-[26px] border border-[#D6E2D9] bg-[#E7EFE9] p-5 sm:p-7"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-[#2F6F68]" /><h2 className="font-display text-xl">การใช้งานและความเป็นส่วนตัว</h2></div><p className="mt-3 text-sm leading-6 text-[#61726B]">ข้อมูลรายจ่ายและบิลของคุณใช้สำหรับการจัดการภายในแอปตามบัญชีผู้ใช้งาน การประมวลผลบิลจะทำเมื่อคุณเลือกอัปโหลด และคุณสามารถแก้ไขหรือลบรายการได้ภายหลัง</p></section>
        <p className="mt-6 text-center text-xs text-[#8C908B]">บ้านเรา · Home Expenses · เวอร์ชัน {appVersion}</p>
      </div>
    </main>
  );
}
