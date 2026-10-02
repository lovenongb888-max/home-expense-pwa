import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import superjson from "superjson";
import App from "./App";
import { startLogin } from "./const";
import "./index.css";

if (Capacitor.isNativePlatform()) document.documentElement.classList.add("android-shell");

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError) || typeof window === "undefined") return;
  if (error.message === UNAUTHED_ERR_MSG) startLogin();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") redirectToLoginIfUnauthorized(event.query.state.error);
});
queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") redirectToLoginIfUnauthorized(event.mutation.state.error);
});

const trpcClient = trpc.createClient({
  links: [httpBatchLink({
    url: "/api/trpc",
    transformer: superjson,
    headers() {
      try {
        const raw = sessionStorage.getItem("manus-cookie");
        const prefix = `${COOKIE_NAME}=`;
        const pair = raw?.split(";").find(s => s.trim().startsWith(prefix));
        const token = pair?.trim().slice(prefix.length);
        return token ? { Authorization: `Bearer ${token}` } : {};
      } catch { return {}; }
    },
    fetch(input, init) { return globalThis.fetch(input, { ...(init ?? {}), credentials: "include" }); },
  })],
});

if ("serviceWorker" in navigator) window.addEventListener("load", () => {
  void navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then(registration => {
    void registration.update();
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      sessionStorage.setItem("baan-rao-web-updated", "1");
      window.location.reload();
    }, { once: true });
  }).catch(() => undefined);
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}><App /></QueryClientProvider>
  </trpc.Provider>,
);
