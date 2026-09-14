import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "space.manus.homeexpapp",
  appName: "บ้านเรา",
  webDir: "dist/public",
  server: {
    url: "https://homeexpapp-cu6ysndw.manus.space",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
