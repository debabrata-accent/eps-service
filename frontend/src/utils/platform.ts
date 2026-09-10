import { Capacitor } from '@capacitor/core';

/** True when running inside the native Android/iOS app (not a web browser). */
export const isNative = (): boolean => Capacitor.isNativePlatform();

const REFRESH_KEY = 'refreshToken';

// On native, cross-site cookies to the Railway backend aren't reliable, so we
// persist the refresh token ourselves and send it explicitly on /auth/refresh.
export const refreshTokenStore = {
  get: (): string | null => localStorage.getItem(REFRESH_KEY),
  set: (token: string): void => localStorage.setItem(REFRESH_KEY, token),
  clear: (): void => localStorage.removeItem(REFRESH_KEY),
};
