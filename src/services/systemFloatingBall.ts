import { Capacitor, registerPlugin } from '@capacitor/core';
import { executeTranslation } from './translatorService.ts';
import { AVAILABLE_PACKS } from './offlineData.ts';
import {
  AppLanguage,
  UI_LOCALES,
  getLocalizedLangName,
  getStoredAppLanguage,
} from './appTranslations.ts';

interface FloatingBallOverlayPlugin {
  checkOverlayPermission(): Promise<{ granted: boolean; running: boolean }>;
  requestOverlayPermission(): Promise<{ granted: boolean }>;
  startOverlay(options?: { targetLang?: string }): Promise<{
    started: boolean;
    needsPermission: boolean;
    running: boolean;
  }>;
  stopOverlay(): Promise<{ stopped: boolean; running: boolean }>;
  getStatus(): Promise<{ permissionGranted: boolean; running: boolean }>;
}

const FloatingBallOverlay = registerPlugin<FloatingBallOverlayPlugin>('FloatingBallOverlay');

export type ExternalBallMode = 'android' | 'pip' | 'unsupported';

export interface ExternalBallStatus {
  mode: ExternalBallMode;
  running: boolean;
  permissionGranted: boolean;
}

export interface ExternalBallActionResult {
  success: boolean;
  mode: ExternalBallMode;
  running: boolean;
  message: string;
}

let activePipWindow: Window | null = null;
const EXTERNAL_BALL_EVENT = 'tarjuman-external-ball-changed';

export function emitExternalBallChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EXTERNAL_BALL_EVENT));
  }
}

export function subscribeExternalBallChanged(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EXTERNAL_BALL_EVENT, listener);
  return () => window.removeEventListener(EXTERNAL_BALL_EVENT, listener);
}

export function isNativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export function isDocumentPiPSupported(): boolean {
  return typeof window !== 'undefined' && 'documentPictureInPicture' in window;
}

export async function getExternalBallStatus(): Promise<ExternalBallStatus> {
  if (isNativeAndroid()) {
    try {
      const status = await FloatingBallOverlay.getStatus();
      return {
        mode: 'android',
        running: Boolean(status.running),
        permissionGranted: Boolean(status.permissionGranted),
      };
    } catch {
      return { mode: 'android', running: false, permissionGranted: false };
    }
  }

  if (isDocumentPiPSupported()) {
    return {
      mode: 'pip',
      running: Boolean(activePipWindow && !activePipWindow.closed),
      permissionGranted: true,
    };
  }

  return {
    mode: 'unsupported',
    running: false,
    permissionGranted: false,
  };
}

export async function enableExternalFloatingBall(
  targetLang = 'ar',
  forceOffline = false,
  appLang: AppLanguage = getStoredAppLanguage()
): Promise<ExternalBallActionResult> {
  const isAr = appLang === 'ar';
  if (isNativeAndroid()) {
    try {
      const perm = await FloatingBallOverlay.checkOverlayPermission();
      if (!perm.granted) {
        const requested = await FloatingBallOverlay.requestOverlayPermission();
        if (!requested.granted) {
          emitExternalBallChanged();
          return {
            success: false,
            mode: 'android',
            running: false,
            message: isAr
              ? 'يرجى السماح بصلاحية «الظهور فوق التطبيقات الأخرى» لتشغيل الكرة على الشاشة الرئيسية وباقي التطبيقات.'
              : 'Please allow "Display over other apps" permission to run the floating ball on the home screen.',
          };
        }
      }

      const res = await FloatingBallOverlay.startOverlay({ targetLang });
      emitExternalBallChanged();
      return {
        success: Boolean(res.started),
        mode: 'android',
        running: Boolean(res.running),
        message: res.started
          ? isAr
            ? 'تم تشغيل الكرة العائمة خارج التطبيق! يمكنك الآن الخروج إلى الشاشة الرئيسية أو أي تطبيق آخر.'
            : 'Floating ball started outside the app! You can now switch to your home screen or any app.'
          : isAr
          ? 'تعذر تشغيل الكرة العائمة خارج التطبيق.'
          : 'Could not start the floating ball outside the app.',
      };
    } catch {
      return {
        success: false,
        mode: 'android',
        running: false,
        message: isAr
          ? 'حدث خطأ أثناء تشغيل خدمة الكرة العائمة على أندرويد.'
          : 'An error occurred while starting the Android overlay service.',
      };
    }
  }

  if (isDocumentPiPSupported()) {
    try {
      if (activePipWindow && !activePipWindow.closed) {
        activePipWindow.focus();
        return {
          success: true,
          mode: 'pip',
          running: true,
          message: isAr
            ? 'النافذة العائمة تعمل بالفعل خارج التطبيق.'
            : 'Floating window is already active outside the app.',
        };
      }

      const pipApi = (window as unknown as {
        documentPictureInPicture: {
          requestWindow: (opts: { width: number; height: number }) => Promise<Window>;
        };
      }).documentPictureInPicture;

      const pipWin = await pipApi.requestWindow({ width: 350, height: 340 });
      activePipWindow = pipWin;
      buildPipTranslatorUi(pipWin, targetLang, forceOffline, appLang);

      pipWin.addEventListener('pagehide', () => {
        activePipWindow = null;
        emitExternalBallChanged();
      });

      emitExternalBallChanged();
      return {
        success: true,
        mode: 'pip',
        running: true,
        message: isAr
          ? 'تم فتح نافذة الكرة العائمة خارج التطبيق (تظهر فوق جميع النوافذ والتطبيقات).'
          : 'External floating ball window opened (appears over other apps and windows).',
      };
    } catch {
      return {
        success: false,
        mode: 'pip',
        running: false,
        message: isAr
          ? 'لم يتم فتح النافذة العائمة — يرجى النقر مجدداً للسماح بها.'
          : 'Floating window was not opened — click again to allow.',
      };
    }
  }

  return {
    success: false,
    mode: 'unsupported',
    running: false,
    message: isAr
      ? 'الظهور فوق الشاشة الرئيسية والتطبيقات الأخرى مدعوم مباشرة في تطبيق أندرويد (APK) أو في متصفحات Chrome الداعمة للنافذة العائمة.'
      : 'Displaying over the home screen and other apps is supported directly in the Android APK or Chromium Document Picture-in-Picture browsers.',
  };
}

export async function disableExternalFloatingBall(
  appLang: AppLanguage = getStoredAppLanguage()
): Promise<ExternalBallActionResult> {
  const isAr = appLang === 'ar';
  if (isNativeAndroid()) {
    try {
      await FloatingBallOverlay.stopOverlay();
      emitExternalBallChanged();
      return {
        success: true,
        mode: 'android',
        running: false,
        message: isAr ? 'تم إيقاف الكرة العائمة خارج التطبيق.' : 'External floating ball stopped.',
      };
    } catch {
      return {
        success: false,
        mode: 'android',
        running: false,
        message: isAr ? 'تعذر إيقاف الكرة العائمة.' : 'Failed to stop the floating ball.',
      };
    }
  }

  if (activePipWindow && !activePipWindow.closed) {
    activePipWindow.close();
    activePipWindow = null;
    emitExternalBallChanged();
    return {
      success: true,
      mode: 'pip',
      running: false,
      message: isAr ? 'تم إغلاق النافذة العائمة خارج التطبيق.' : 'External floating window closed.',
    };
  }

  return {
    success: true,
    mode: isDocumentPiPSupported() ? 'pip' : 'unsupported',
    running: false,
    message: isAr ? 'الكرة العائمة الخارجية متوقفة.' : 'External floating ball is off.',
  };
}

function buildPipTranslatorUi(
  pipWin: Window,
  initialTargetLang: string,
  forceOffline: boolean,
  appLang: AppLanguage
) {
  const t = UI_LOCALES[appLang] || UI_LOCALES.ar;
  const doc = pipWin.document;
  doc.documentElement.dir = appLang === 'ar' ? 'rtl' : 'ltr';
  doc.documentElement.lang = appLang;
  doc.title = t.floatingBall.popupTitle;

  const body = doc.body;
  body.style.margin = '0';
  body.style.padding = '12px';
  body.style.background = '#020617';
  body.style.color = '#f1f5f9';
  body.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  body.style.boxSizing = 'border-box';

  const card = doc.createElement('div');
  card.style.background = '#0f172a';
  card.style.border = '1px solid #0891b2';
  card.style.borderRadius = '16px';
  card.style.padding = '12px';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.gap = '10px';

  const header = doc.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'space-between';

  const title = doc.createElement('strong');
  title.textContent = `🔮 ${t.floatingBall.popupTitle}`;
  title.style.fontSize = '13px';
  title.style.color = '#67e8f9';

  const closeBtn = doc.createElement('button');
  closeBtn.textContent = `${t.common.close} ✕`;
  closeBtn.style.background = '#4c0519';
  closeBtn.style.color = '#fda4af';
  closeBtn.style.border = '1px solid #be123c';
  closeBtn.style.borderRadius = '8px';
  closeBtn.style.padding = '4px 8px';
  closeBtn.style.fontSize = '11px';
  closeBtn.style.fontWeight = '700';
  closeBtn.style.cursor = 'pointer';
  closeBtn.addEventListener('click', () => {
    pipWin.close();
  });

  header.appendChild(title);
  header.appendChild(closeBtn);
  card.appendChild(header);

  const select = doc.createElement('select');
  select.style.background = '#020617';
  select.style.color = '#67e8f9';
  select.style.border = '1px solid #1e293b';
  select.style.borderRadius = '10px';
  select.style.padding = '6px 8px';
  select.style.fontSize = '12px';
  select.style.fontWeight = '700';

  for (const pack of AVAILABLE_PACKS) {
    const opt = doc.createElement('option');
    opt.value = pack.code;
    opt.textContent = `${pack.flag} ${getLocalizedLangName(pack.code, appLang, pack.nameEn)}`;
    if (pack.code === initialTargetLang) opt.selected = true;
    select.appendChild(opt);
  }
  card.appendChild(select);

  const input = doc.createElement('textarea');
  input.rows = 3;
  input.placeholder = t.floatingBall.inputPlaceholder;
  input.style.width = '100%';
  input.style.boxSizing = 'border-box';
  input.style.background = '#020617';
  input.style.color = '#f8fafc';
  input.style.border = '1px solid #334155';
  input.style.borderRadius = '10px';
  input.style.padding = '8px';
  input.style.fontSize = '12px';
  input.style.resize = 'none';
  card.appendChild(input);

  const btn = doc.createElement('button');
  btn.textContent = `⚡ ${t.common.translateNow}`;
  btn.style.background = '#0284c7';
  btn.style.color = '#ffffff';
  btn.style.border = 'none';
  btn.style.borderRadius = '10px';
  btn.style.padding = '8px 12px';
  btn.style.fontSize = '12px';
  btn.style.fontWeight = '700';
  btn.style.cursor = 'pointer';
  card.appendChild(btn);

  const output = doc.createElement('div');
  output.textContent = '...';
  output.style.background = '#020617';
  output.style.border = '1px solid #164e63';
  output.style.borderRadius = '10px';
  output.style.padding = '10px';
  output.style.fontSize = '13px';
  output.style.minHeight = '48px';
  output.style.color = '#e2e8f0';
  card.appendChild(output);

  const runTranslate = async () => {
    const text = input.value.trim();
    if (!text) return;
    output.textContent = t.common.translating;
    try {
      const res = await executeTranslation(text, 'auto', select.value, false, forceOffline);
      output.textContent = res.result.translatedText;
    } catch (err: unknown) {
      output.textContent = err instanceof Error ? err.message : 'تعذر إتمام الترجمة';
    }
  };

  btn.addEventListener('click', runTranslate);
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      runTranslate();
    }
  });

  body.appendChild(card);
}
