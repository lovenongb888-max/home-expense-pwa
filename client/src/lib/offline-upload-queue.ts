export type QueuedExpensePayload = {
  title: string;
  recipientName: string | null;
  amount: string;
  categoryId: number | null;
  spentAt: string;
  referenceNumber: string | null;
  note: string | null;
  receiptKey: string | null;
  receiptUrl: string | null;
};

export type QueuedReceipt = {
  fileName: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  base64: string;
};

export type QueuedExpense = {
  id: string;
  createdAt: number;
  payload: QueuedExpensePayload;
  receipt: QueuedReceipt | null;
};

const DB_NAME = "baan-rao-offline";
const STORE_NAME = "expense-upload-queue";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("เปิดคิวออฟไลน์ไม่สำเร็จ"));
  });
}

export async function enqueueExpense(item: Omit<QueuedExpense, "id" | "createdAt">) {
  const queued: QueuedExpense = { ...item, id: crypto.randomUUID(), createdAt: Date.now() };
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).add(queued);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("เพิ่มคิวไม่สำเร็จ"));
  });
  db.close();
  return queued;
}

export async function listQueuedExpenses(): Promise<QueuedExpense[]> {
  const db = await openDb();
  const items = await new Promise<QueuedExpense[]>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve((request.result as QueuedExpense[]).sort((a, b) => a.createdAt - b.createdAt));
    request.onerror = () => reject(request.error ?? new Error("อ่านคิวไม่สำเร็จ"));
  });
  db.close();
  return items;
}

export async function removeQueuedExpense(id: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("ลบคิวไม่สำเร็จ"));
  });
  db.close();
}
