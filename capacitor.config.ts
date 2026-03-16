import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.dmw.leaveapp',
  appName: 'DMW Leave Management',
  webDir: 'dist',
  android: {
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    Keyboard: {
      resize: KeyboardResize.Native,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_INSIDE",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#ED7A2B",
      splashFullScreen: true,
      splashImmersive: true,
    }
  }
};

export default config;
