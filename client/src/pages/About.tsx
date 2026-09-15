import { ArrowLeft, CheckCircle2, Home, Info, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "wouter";

const appVersion = "1.0.0";
const androidVersion = "1.0";
const releaseDate = "15 กันยายน 2569";

export default function About() {
  return (
    <main className="min-h-[100dvh] bg-[#F7F5EF] px-4 py-5 text-[#242C2A] sm:px-6 md:px-10 md:py-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-[#2F6F68] transition-colors hover:bg-white">
            <ArrowLeft className="h-4 w-4" /> กลับหน้าหลัก
          </Link>
          <Link href="/" aria-label="หน้าหลัก" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2F6F68] text-white shadow-lg shadow-[#2F6F68]/15">
            <Home className="h-5 w-5" />
          </Link>
        </header>

        <section className="overflow-hidden rounded-[30px] bg-[#2F6F68] p-6 text-white shadow-xl shadow-[#2F6F68]/15 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Info className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm tracking-[0.14em] text-white/65">ABOUT THE APP</p>
              <h1 className="font-display mt-1 text-3xl font-semibold">เกี่ยวกับบ้านเรา</h1>
              <p className="mt-2 text-sm leading-6 text-white/75">ผู้ช่วยจัดการรายจ่ายในบ้านให้เป็นเรื่องง่าย อ่านบิล เก็บรายการ และดูภาพรวมได้ในที่เดียว</p>
            </div>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs text-white/60">เวอร์ชันแอป</p><p className="font-numeric mt-1 text-xl">{appVersion}</p></div>
            <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs text-white/60">Android</p><p className="font-numeric mt-1 text-xl">{androidVersion}</p></div>
            <div className="col-span-2 rounded-2xl bg-white/10 p-3 sm:col-span-1"><p className="text-xs text-white/60">อัปเดตล่าสุด</p><p className="mt-1 text-sm">{releaseDate}</p></div>
          </div>
        </section>

        <section className="mt-5 rounded-[26px] border border-[#E5E3DC] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-[#B18A36]" /><h2 className="font-display text-xl">รายละเอียดการอัปเดต</h2></div>
          <p className="mt-2 text-sm text-[#777D78]">เวอร์ชัน {appVersion} · {releaseDate}</p>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-[#52645D]">
            <li className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#4E9A78]" />เพิ่มการส่งออกสรุปรายจ่ายเป็นไฟล์ JPG โดยแสดงเฉพาะรายการ จำนวนเงิน และยอดรวม</li>
            <li className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#4E9A78]" />ปรับปรุงการอ่านบิล JPG, PNG, WebP และ PDF รวมถึงบิลค่าเน็ตบ้าน AIS</li>
            <li className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#4E9A78]" />เพิ่มการอ่าน QR Code และ Barcode พร้อมเติมเลขอ้างอิงหรือหมายเหตุอัตโนมัติ</li>
            <li className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#4E9A78]" />รองรับแก้ไข ลบ ดูประวัติรายจ่าย และบันทึกคิวอัปโหลดเมื่อออฟไลน์</li>
            <li className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#4E9A78]" />ปรับหน้าจอ Android ให้รองรับมือถือจอเล็ก แท็บเล็ต และโหมดแนวนอน</li>
          </ul>
        </section>

        <section className="mt-5 rounded-[26px] border border-[#D6E2D9] bg-[#E7EFE9] p-5 sm:p-7">
          <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-[#2F6F68]" /><h2 className="font-display text-xl">การใช้งานและความเป็นส่วนตัว</h2></div>
          <p className="mt-3 text-sm leading-6 text-[#61726B]">ข้อมูลรายจ่ายและบิลของคุณใช้สำหรับการจัดการภายในแอปตามบัญชีผู้ใช้งาน การประมวลผลบิลจะทำเมื่อคุณเลือกอัปโหลด และคุณสามารถแก้ไขหรือลบรายการได้ภายหลัง</p>
        </section>

        <p className="mt-6 text-center text-xs text-[#8C908B]">บ้านเรา · Home Expenses · เวอร์ชัน {appVersion}</p>
      </div>
    </main>
  );
}
