import { ArrowLeft, FileText, Home, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Legal() {
  const [location] = useLocation();
  const isPrivacy = location === "/privacy";
  return (
    <main className="min-h-[100dvh] bg-[#F7F5EF] px-4 py-5 text-[#242C2A] sm:px-6 md:px-10 md:py-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between gap-3">
          <Link href="/about" className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-[#2F6F68] hover:bg-white"><ArrowLeft className="h-4 w-4" /> กลับหน้าเกี่ยวกับแอป</Link>
          <Link href="/" aria-label="หน้าหลัก" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2F6F68] text-white"><Home className="h-5 w-5" /></Link>
        </header>
        <section className="rounded-[30px] bg-[#2F6F68] p-6 text-white shadow-xl shadow-[#2F6F68]/15 sm:p-8">
          <div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">{isPrivacy ? <ShieldCheck className="h-7 w-7" /> : <FileText className="h-7 w-7" />}</div><div><p className="text-sm tracking-[0.14em] text-white/65">บ้านเรา · HOME EXPENSES</p><h1 className="font-display mt-1 text-3xl font-semibold">{isPrivacy ? "นโยบายความเป็นส่วนตัว" : "เงื่อนไขการใช้งาน"}</h1><p className="mt-2 text-sm text-white/75">อัปเดตล่าสุด 15 กันยายน 2569</p></div></div>
        </section>
        {isPrivacy ? <PrivacyContent /> : <TermsContent />}
        <p className="mt-6 text-center text-xs text-[#8C908B]">บ้านเรา · Home Expenses · เวอร์ชัน 1.0.0</p>
      </div>
    </main>
  );
}

function TermsContent() {
  return <section className="mt-5 space-y-4 rounded-[26px] border border-[#E5E3DC] bg-white p-5 text-sm leading-7 text-[#52645D] shadow-sm sm:p-7">
    <h2 className="font-display text-xl text-[#242C2A]">1. การยอมรับเงื่อนไข</h2><p>การใช้แอปบ้านเราถือว่าคุณยอมรับเงื่อนไขการใช้งานนี้ แอปจัดทำขึ้นเพื่อช่วยบันทึกและสรุปค่าใช้จ่ายส่วนบุคคลหรือภายในครอบครัว</p>
    <h2 className="font-display text-xl text-[#242C2A]">2. ความถูกต้องของข้อมูล</h2><p>คุณเป็นผู้รับผิดชอบข้อมูลรายจ่ายและไฟล์บิลที่อัปโหลด การอ่านข้อมูลจาก OCR, QR Code หรือ Barcode เป็นตัวช่วยอัตโนมัติ ควรตรวจสอบความถูกต้องก่อนบันทึกหรือใช้ข้อมูลเพื่อการตัดสินใจ</p>
    <h2 className="font-display text-xl text-[#242C2A]">3. การใช้บริการ</h2><p>ห้ามใช้แอปเพื่อกิจกรรมที่ผิดกฎหมาย ละเมิดสิทธิของผู้อื่น หรืออัปโหลดเนื้อหาที่คุณไม่มีสิทธิ์ใช้งาน ผู้ดูแลอาจปรับปรุง ระงับ หรือยุติบางฟีเจอร์เพื่อความปลอดภัยและการดูแลระบบ</p>
    <h2 className="font-display text-xl text-[#242C2A]">4. ข้อจำกัดความรับผิดชอบ</h2><p>แอปเป็นเครื่องมือช่วยจัดการข้อมูล ไม่ใช่คำแนะนำทางการเงิน ภาษี กฎหมาย หรือบัญชี ผู้ใช้ควรสำรองข้อมูลและตรวจสอบข้อมูลสำคัญด้วยตนเอง</p>
    <h2 className="font-display text-xl text-[#242C2A]">5. ติดต่อผู้ดูแล</h2><p>หากมีคำถามเกี่ยวกับเงื่อนไข กรุณาติดต่อผู้ดูแลโปรเจกต์ผ่านช่องทางที่ใช้จัดการแอป</p>
  </section>;
}

function PrivacyContent() {
  return <section className="mt-5 space-y-4 rounded-[26px] border border-[#D6E2D9] bg-[#E7EFE9] p-5 text-sm leading-7 text-[#52645D] shadow-sm sm:p-7">
    <h2 className="font-display text-xl text-[#242C2A]">1. ข้อมูลที่จัดเก็บ</h2><p>แอปอาจจัดเก็บข้อมูลบัญชีผู้ใช้ รายการรายจ่าย หมวดหมู่ เลขอ้างอิง หมายเหตุ และไฟล์บิลที่คุณเลือกอัปโหลด เพื่อให้บริการบันทึกและสรุปข้อมูล</p>
    <h2 className="font-display text-xl text-[#242C2A]">2. การประมวลผลบิล</h2><p>เมื่อคุณเลือกใช้ OCR หรือการอ่าน QR/Barcode ระบบจะประมวลผลไฟล์เพื่อดึงข้อมูลที่เกี่ยวข้อง เช่น จำนวนเงิน วันที่ และเลขอ้างอิง คุณสามารถแก้ไขหรือลบข้อมูลภายหลังได้</p>
    <h2 className="font-display text-xl text-[#242C2A]">3. การจัดเก็บและความปลอดภัย</h2><p>ข้อมูลถูกผูกกับบัญชีผู้ใช้และควรเข้าถึงเฉพาะเจ้าของบัญชี เราพยายามใช้มาตรการที่เหมาะสมเพื่อปกป้องข้อมูล แต่ไม่มีระบบออนไลน์ใดรับประกันความปลอดภัยได้อย่างสมบูรณ์</p>
    <h2 className="font-display text-xl text-[#242C2A]">4. สิทธิของคุณ</h2><p>คุณสามารถตรวจสอบ แก้ไข หรือลบรายการรายจ่ายและไฟล์บิลผ่านแอป หากต้องการสอบถามหรือลบข้อมูลเพิ่มเติม ให้ติดต่อผู้ดูแลโปรเจกต์</p>
    <h2 className="font-display text-xl text-[#242C2A]">5. การเปลี่ยนแปลงนโยบาย</h2><p>นโยบายนี้อาจมีการปรับปรุงเมื่อฟีเจอร์หรือวิธีการจัดการข้อมูลเปลี่ยนแปลง โดยจะแสดงวันที่อัปเดตล่าสุดไว้บนหน้านี้</p>
  </section>;
}
