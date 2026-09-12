import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Camera,
  Car,
  Check,
  ChevronDown,
  Circle,
  FileCheck2,
  HeartPulse,
  Home as HomeIcon,
  Loader2,
  Plus,
  ReceiptText,
  Settings2,
  ShoppingBag,
  Trash2,
  Utensils,
  WalletCards,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const iconMap: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  house: HomeIcon,
  "shopping-bag": ShoppingBag,
  "heart-pulse": HeartPulse,
  circle: Circle,
};

const baht = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 2 });
const shortDate = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" });
const monthLabel = new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" });

function formatBaht(amount: string | number) {
  return baht.format(Number(amount) || 0).replace("฿", "฿ ");
}

function toDateInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function getCategoryIcon(icon?: string | null) {
  return iconMap[icon ?? "circle"] ?? Circle;
}

type ExpenseDraft = {
  title: string;
  amount: string;
  categoryId: string;
  spentAt: string;
  note: string;
  file: File | null;
};

const emptyDraft = (): ExpenseDraft => ({
  title: "",
  amount: "",
  categoryId: "",
  spentAt: toDateInput(new Date()),
  note: "",
  file: null,
});

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const { user } = useAuth();
  const today = new Date();
  const [period, setPeriod] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
  const [isExpenseOpen, setExpenseOpen] = useState(false);
  const [isCategoryOpen, setCategoryOpen] = useState(false);
  const [draft, setDraft] = useState<ExpenseDraft>(emptyDraft);
  const [newCategory, setNewCategory] = useState("");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const categoriesQuery = trpc.categories.list.useQuery(undefined, { enabled: Boolean(user) });
  const expensesQuery = trpc.expenses.list.useQuery(period, { enabled: Boolean(user) });
  const statsQuery = trpc.expenses.stats.useQuery(period, { enabled: Boolean(user) });
  const uploadReceipt = trpc.receipts.upload.useMutation();
  const createExpense = trpc.expenses.create.useMutation();
  const deleteExpense = trpc.expenses.delete.useMutation();
  const createCategory = trpc.categories.create.useMutation();
  const deleteCategory = trpc.categories.delete.useMutation();

  useEffect(() => {
    const onInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onInstall);
    return () => window.removeEventListener("beforeinstallprompt", onInstall);
  }, []);

  const categories = categoriesQuery.data ?? [];
  const expenses = expensesQuery.data ?? [];
  const total = Number(statsQuery.data?.total ?? 0);
  const categoryTotals = useMemo(() => {
    const totals = new Map<number, number>();
    expenses.forEach(expense => {
      if (expense.categoryId) totals.set(expense.categoryId, (totals.get(expense.categoryId) ?? 0) + Number(expense.amount));
    });
    return categories.map(category => ({ ...category, total: totals.get(category.id) ?? 0 })).sort((a, b) => b.total - a.total);
  }, [categories, expenses]);

  const navigatePeriod = (delta: number) => {
    const next = new Date(period.year, period.month - 1 + delta, 1);
    setPeriod({ year: next.getFullYear(), month: next.getMonth() + 1 });
  };

  const submitExpense = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.amount || Number(draft.amount) <= 0) {
      toast.error("กรุณากรอกชื่อรายการและจำนวนเงิน");
      return;
    }
    try {
      let receipt: { key: string; url: string } | undefined;
      if (draft.file) {
        const base64 = await fileToBase64(draft.file);
        receipt = await uploadReceipt.mutateAsync({
          fileName: draft.file.name,
          mimeType: draft.file.type as "image/jpeg" | "image/png" | "image/webp" | "application/pdf",
          base64,
        });
      }
      await createExpense.mutateAsync({
        title: draft.title.trim(),
        amount: draft.amount,
        categoryId: draft.categoryId ? Number(draft.categoryId) : null,
        spentAt: new Date(`${draft.spentAt}T12:00:00`),
        note: draft.note.trim() || null,
        receiptKey: receipt?.key ?? null,
        receiptUrl: receipt?.url ?? null,
      });
      toast.success("บันทึกรายจ่ายแล้ว");
      setDraft(emptyDraft());
      setExpenseOpen(false);
      await Promise.all([utils.expenses.list.invalidate(), utils.expenses.stats.invalidate()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ");
    }
  };

  const submitCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newCategory.trim()) return;
    try {
      await createCategory.mutateAsync({ name: newCategory.trim(), color: "#3B7D78" });
      setNewCategory("");
      toast.success("เพิ่มหมวดหมู่แล้ว");
      await categoriesQuery.refetch();
    } catch {
      toast.error("เพิ่มหมวดหมู่ไม่สำเร็จ");
    }
  };

  const removeCategory = async (id: number) => {
    if (!window.confirm("ลบหมวดหมู่นี้หรือไม่? รายจ่ายเดิมจะยังอยู่แต่ไม่ผูกหมวดหมู่")) return;
    await deleteCategory.mutateAsync({ id });
    toast.success("ลบหมวดหมู่แล้ว");
    await categoriesQuery.refetch();
  };

  const removeExpense = async (id: number) => {
    if (!window.confirm("ลบรายการรายจ่ายนี้หรือไม่?")) return;
    await deleteExpense.mutateAsync({ id });
    toast.success("ลบรายการแล้ว");
    await Promise.all([utils.expenses.list.invalidate(), utils.expenses.stats.invalidate()]);
  };

  const installApp = async () => {
    if (!installPrompt) {
      toast.info("เปิดเมนูเบราว์เซอร์ แล้วเลือก 'เพิ่มลงในหน้าจอหลัก' ได้เลย");
      return;
    }
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-[#F7F5EF] flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-6">
          <div className="mx-auto h-16 w-16 rounded-3xl bg-[#2F6F68] text-white flex items-center justify-center shadow-xl shadow-[#2F6F68]/20"><WalletCards className="h-8 w-8" /></div>
          <div><p className="eyebrow">บ้านเรา / HOME EXPENSES</p><h1 className="font-display text-4xl mt-3">จัดเงินให้อยู่<br /><span className="text-[#2F6F68]">แบบที่เป็นเรา</span></h1><p className="text-[#706F69] mt-4 leading-7">รวมรายจ่ายในบ้านไว้ที่เดียว เพิ่มหมวดหมู่ได้เอง และเก็บสลิปให้ค้นง่าย</p></div>
          <Button onClick={() => startLogin()} className="w-full h-12 rounded-xl bg-[#2F6F68] hover:bg-[#275E58] text-white">เข้าสู่ระบบเพื่อเริ่มใช้งาน</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F7F5EF] text-[#242C2A] -m-4 md:-m-6">
      <div className="max-w-[1440px] mx-auto px-5 py-5 md:px-10 md:py-8">
        <header className="flex items-center justify-between gap-4 mb-7">
          <div className="flex items-center gap-3"><div className="h-11 w-11 rounded-2xl bg-[#2F6F68] text-white flex items-center justify-center shadow-lg shadow-[#2F6F68]/15"><WalletCards className="h-5 w-5" /></div><div><p className="font-display text-xl font-semibold leading-none">บ้านเรา</p><p className="text-[11px] tracking-[0.18em] text-[#8C908B] uppercase mt-1">home expenses</p></div></div>
          <div className="flex items-center gap-2"><Button variant="ghost" onClick={installApp} className="hidden sm:flex text-[#5E6A65] hover:bg-white rounded-xl"><ArrowDownLeft className="h-4 w-4 mr-2 rotate-[-45deg]" />ติดตั้งแอป</Button><div className="h-10 w-10 rounded-full bg-[#D7E7DE] flex items-center justify-center text-[#2F6F68] font-semibold">{(user.name ?? "U").slice(0, 1).toUpperCase()}</div></div>
        </header>

        <section className="grid lg:grid-cols-[1.45fr_0.8fr] gap-5 items-stretch">
          <div className="rounded-[28px] bg-[#2F6F68] text-white p-6 md:p-8 relative overflow-hidden min-h-[250px] flex flex-col justify-between shadow-xl shadow-[#2F6F68]/15">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10" /><div className="absolute right-10 -bottom-20 h-48 w-48 rounded-full border border-white/10" />
            <div className="relative"><p className="eyebrow text-white/60">สรุปค่าใช้จ่าย / {period.month.toString().padStart(2, "0")}</p><h1 className="font-display text-4xl md:text-5xl mt-3 tracking-tight">{formatBaht(total)}</h1><p className="text-white/65 mt-2">{statsQuery.data?.count ?? expenses.length} รายการในเดือนนี้</p></div>
            <div className="relative flex items-center justify-between pt-7"><div className="flex items-center gap-2 text-sm text-white/80"><BarChart3 className="h-4 w-4" />ภาพรวมการใช้จ่าย</div><Button onClick={() => { setDraft(emptyDraft()); setExpenseOpen(true); }} className="rounded-xl bg-[#E5B95D] hover:bg-[#D7A94D] text-[#2B403B] font-semibold shadow-lg shadow-black/10"><Plus className="h-4 w-4 mr-2" />เพิ่มรายจ่าย</Button></div>
          </div>
          <div className="rounded-[28px] bg-[#E7EFE9] p-6 md:p-7 flex flex-col justify-between border border-[#D6E2D9]"><div className="flex justify-between items-start"><div><p className="eyebrow text-[#648078]">เดือนที่กำลังดู</p><p className="font-display text-2xl mt-2 capitalize">{monthLabel.format(new Date(period.year, period.month - 1, 1))}</p></div><div className="h-11 w-11 rounded-2xl bg-white/70 text-[#2F6F68] flex items-center justify-center"><ReceiptText className="h-5 w-5" /></div></div><div className="flex items-center justify-between mt-8"><Button variant="ghost" onClick={() => navigatePeriod(-1)} className="h-10 w-10 p-0 rounded-xl hover:bg-white/70"><ArrowLeft className="h-4 w-4" /></Button><span className="text-sm text-[#61726B]">เลื่อนดูรายเดือน</span><Button variant="ghost" onClick={() => navigatePeriod(1)} className="h-10 w-10 p-0 rounded-xl hover:bg-white/70"><ArrowRight className="h-4 w-4" /></Button></div></div>
        </section>

        <div className="grid lg:grid-cols-[1.45fr_0.8fr] gap-5 mt-5 items-start">
          <section className="rounded-[28px] bg-white p-5 md:p-7 shadow-sm border border-[#ECE9E1]">
            <div className="flex items-center justify-between mb-5"><div><p className="eyebrow">รายการล่าสุด</p><h2 className="font-display text-2xl mt-1">เงินออกไปไหนบ้าง</h2></div><span className="text-xs text-[#8C908B] bg-[#F7F5EF] rounded-full px-3 py-1.5">เรียงจากล่าสุด</span></div>
            {expensesQuery.isLoading ? <div className="py-16 flex justify-center text-[#2F6F68]"><Loader2 className="h-6 w-6 animate-spin" /></div> : expenses.length === 0 ? <div className="py-14 text-center border border-dashed border-[#D9DDD6] rounded-2xl"><ReceiptText className="h-8 w-8 mx-auto text-[#A8B3AD]" /><p className="font-medium mt-3">ยังไม่มีรายจ่ายในเดือนนี้</p><p className="text-sm text-[#8C908B] mt-1">เริ่มจากกด “เพิ่มรายจ่าย” และแนบสลิปได้เลย</p></div> : <div className="space-y-1">{expenses.map(expense => { const Icon = getCategoryIcon(expense.categoryIcon); return <div key={expense.id} className="group flex items-center gap-3 py-3.5 border-b last:border-0 border-[#F0EEE8]"><div className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${expense.categoryColor ?? "#3B7D78"}18`, color: expense.categoryColor ?? "#3B7D78" }}><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="font-medium truncate">{expense.title}</p>{expense.receiptUrl && <a href={expense.receiptUrl} target="_blank" rel="noreferrer" className="text-[#2F6F68]" title="เปิดสลิป"><FileCheck2 className="h-3.5 w-3.5" /></a>}</div><p className="text-xs text-[#969B96] mt-1">{expense.categoryName ?? "ไม่ระบุหมวดหมู่"} · {shortDate.format(new Date(expense.spentAt))}</p></div><p className="font-semibold text-[#344540] whitespace-nowrap">{formatBaht(expense.amount)}</p><Button variant="ghost" onClick={() => removeExpense(expense.id)} className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-[#B06B67] hover:bg-[#FFF0EF] rounded-lg"><Trash2 className="h-4 w-4" /></Button></div>; })}</div>}
          </section>

          <aside className="space-y-5">
            <section className="rounded-[28px] bg-[#FCFBF7] p-5 md:p-6 border border-[#ECE9E1]"><div className="flex items-center justify-between mb-5"><div><p className="eyebrow">สัดส่วนรายจ่าย</p><h2 className="font-display text-xl mt-1">ตามหมวดหมู่</h2></div><BarChart3 className="h-5 w-5 text-[#91A49A]" /></div><div className="space-y-4">{categoryTotals.slice(0, 5).map(category => { const Icon = getCategoryIcon(category.icon); const percent = total ? Math.min(100, (category.total / total) * 100) : 0; return <div key={category.id}><div className="flex items-center justify-between text-sm mb-1.5"><span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-[#618A82]" />{category.name}</span><span className="text-[#6E7973]">{formatBaht(category.total)}</span></div><div className="h-1.5 bg-[#E9E8E1] rounded-full overflow-hidden"><div className="h-full rounded-full bg-[#5C938A]" style={{ width: `${percent}%` }} /></div></div>; })}</div>{categoryTotals.length === 0 && <p className="text-sm text-[#8C908B]">เพิ่มรายการเพื่อดูสัดส่วน</p>}</section>
            <section className="rounded-[28px] bg-[#FFF4D9] p-5 md:p-6 border border-[#F3E5BF]"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-white/70 flex items-center justify-center text-[#B18A36]"><Settings2 className="h-4 w-4" /></div><div><p className="font-medium">จัดการหมวดหมู่</p><p className="text-xs text-[#927D4D] mt-0.5">เพิ่มหรือลบหัวข้อได้ตามบ้านคุณ</p></div></div><Button variant="outline" onClick={() => setCategoryOpen(value => !value)} className="mt-5 w-full rounded-xl bg-white/60 border-[#EADAAE] text-[#76602B] hover:bg-white">{isCategoryOpen ? "ซ่อนรายการหมวดหมู่" : "เปิดรายการหมวดหมู่"}<ChevronDown className={`h-4 w-4 ml-auto transition-transform ${isCategoryOpen ? "rotate-180" : ""}`} /></Button>{isCategoryOpen && <div className="mt-4 space-y-2"><form onSubmit={submitCategory} className="flex gap-2"><Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="เช่น ค่าเรียนลูก" className="bg-white/70 border-[#EADAAE] rounded-xl" /><Button type="submit" size="icon" className="rounded-xl shrink-0 bg-[#2F6F68] hover:bg-[#275E58]"><Plus className="h-4 w-4" /></Button></form><div className="space-y-1.5 pt-1">{categories.map(category => <div key={category.id} className="flex items-center justify-between bg-white/45 rounded-xl px-3 py-2 text-sm"><span>{category.name}</span><Button variant="ghost" onClick={() => removeCategory(category.id)} className="h-7 w-7 p-0 text-[#B06B67] hover:bg-[#FFF0EF] rounded-lg"><Trash2 className="h-3.5 w-3.5" /></Button></div>)}</div></div>}</section>
          </aside>
        </div>
        <div className="mt-6 flex sm:hidden justify-center"><Button variant="ghost" onClick={installApp} className="text-[#5E6A65] rounded-xl"><ArrowDownLeft className="h-4 w-4 mr-2 rotate-[-45deg]" />ติดตั้งแอปลงมือถือ</Button></div>
      </div>

      {isExpenseOpen && <div className="fixed inset-0 z-50 bg-[#17211F]/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5"><div className="w-full sm:max-w-lg bg-[#FCFBF7] rounded-t-[30px] sm:rounded-[30px] shadow-2xl max-h-[92dvh] overflow-y-auto"><div className="sticky top-0 bg-[#FCFBF7]/95 backdrop-blur px-5 py-4 border-b border-[#ECE9E1] flex items-center justify-between"><div><p className="eyebrow">บันทึกรายการใหม่</p><h2 className="font-display text-2xl mt-1">เพิ่มรายจ่าย</h2></div><Button variant="ghost" onClick={() => setExpenseOpen(false)} className="h-9 w-9 p-0 rounded-xl"><X className="h-5 w-5" /></Button></div><form onSubmit={submitExpense} className="p-5 space-y-4"><div><label className="field-label">รายการ</label><Input autoFocus value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="เช่น ซื้อของเข้าบ้าน" className="h-12 rounded-xl bg-white" /></div><div className="grid grid-cols-2 gap-3"><div><label className="field-label">จำนวนเงิน (บาท)</label><Input type="number" inputMode="decimal" min="0" step="0.01" value={draft.amount} onChange={e => setDraft({ ...draft, amount: e.target.value })} placeholder="0.00" className="h-12 rounded-xl bg-white" /></div><div><label className="field-label">วันที่</label><Input type="date" value={draft.spentAt} onChange={e => setDraft({ ...draft, spentAt: e.target.value })} className="h-12 rounded-xl bg-white" /></div></div><div><label className="field-label">หมวดหมู่</label><select value={draft.categoryId} onChange={e => setDraft({ ...draft, categoryId: e.target.value })} className="h-12 w-full rounded-xl border border-[#E5E3DC] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#2F6F68]/20"><option value="">ไม่ระบุหมวดหมู่</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div><div><label className="field-label">รายละเอียดเพิ่มเติม <span className="normal-case font-normal text-[#A0A39E]">(ถ้ามี)</span></label><Textarea value={draft.note} onChange={e => setDraft({ ...draft, note: e.target.value })} placeholder="บันทึกช่วยจำสั้น ๆ" className="rounded-xl bg-white resize-none" rows={3} /></div><div><label className="field-label">สลิปการโอน</label><input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={e => setDraft({ ...draft, file: e.target.files?.[0] ?? null })} /><button type="button" onClick={() => fileInputRef.current?.click()} className="w-full border border-dashed border-[#B8C8BE] bg-[#F2F6F1] rounded-2xl p-4 flex items-center gap-3 text-left hover:bg-[#EAF2EB] transition-colors"><div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-[#2F6F68]"><Camera className="h-5 w-5" /></div><div className="min-w-0"><p className="text-sm font-medium truncate">{draft.file?.name ?? "แนบรูปสลิปหรือ PDF"}</p><p className="text-xs text-[#8C908B] mt-1">รองรับไฟล์ไม่เกิน 6 MB</p></div>{draft.file ? <Check className="ml-auto h-4 w-4 text-[#2F6F68]" /> : <Plus className="ml-auto h-4 w-4 text-[#8C908B]" />}</button></div><Button type="submit" disabled={createExpense.isPending || uploadReceipt.isPending} className="w-full h-12 rounded-xl bg-[#2F6F68] hover:bg-[#275E58] text-white mt-2">{createExpense.isPending || uploadReceipt.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}บันทึกรายจ่าย</Button></form></div></div>}
    </div>
  );
}

declare global {
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    prompt: () => Promise<{ outcome: "accepted" | "dismissed" }>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  }
}
