import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storagePut } from "../storage";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.post("/api/receipts/upload-xhr", express.raw({ type: ["image/jpeg", "image/png", "image/webp", "application/pdf"], limit: "6mb" }), async (req, res) => {
    try {
      const mimeType = req.header("x-receipt-mime") ?? req.header("content-type");
      if (!mimeType || !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(mimeType)) return res.status(415).json({ message: "รองรับเฉพาะ JPG, PNG, WebP และ PDF" });
      const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);
      if (!body.length) return res.status(400).json({ message: "ไม่พบไฟล์บิล" });
      const fileName = decodeURIComponent(req.header("x-receipt-filename") ?? "receipt").replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120);
      const result = await storagePut(`anonymous/receipts/${Date.now()}-${fileName}`, body, mimeType);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: error instanceof Error ? error.message : "อัปโหลดบิลไม่สำเร็จ" });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
