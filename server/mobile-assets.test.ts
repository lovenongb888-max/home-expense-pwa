import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");

describe("mobile app assets", () => {
  it("contains an offline service worker with navigation fallback", () => {
    const serviceWorker = readFileSync(resolve(projectRoot, "client/public/sw.js"), "utf8");
    expect(serviceWorker).toContain("baan-rao-shell-v3");
    expect(serviceWorker).toContain('event.request.mode === "navigate"');
    expect(serviceWorker).toContain("caches.match(\"/\")");
  });

  it("contains branded Android launcher and splash assets", () => {
    expect(existsSync(resolve(projectRoot, "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png"))).toBe(true);
    expect(existsSync(resolve(projectRoot, "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png"))).toBe(true);
    expect(existsSync(resolve(projectRoot, "android/app/src/main/res/drawable/splash.png"))).toBe(true);
    expect(readFileSync(resolve(projectRoot, "android/app/src/main/res/values/colors.xml"), "utf8")).toContain("#2F6F68");
  });

  it("opts out of Android 15 edge-to-edge content overlap", () => {
    const theme = readFileSync(resolve(projectRoot, "android/app/src/main/res/values-v35/styles.xml"), "utf8");
    expect(theme).toContain("windowOptOutEdgeToEdgeEnforcement");
    expect(readFileSync(resolve(projectRoot, "client/src/index.css"), "utf8")).toContain("safe-area-inset-top");
  });
});
