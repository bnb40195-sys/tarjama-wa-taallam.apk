import { Capacitor, registerPlugin } from '@capacitor/core';
import { executeTranslation } from './translatorService.ts';
import { AVAILABLE_PACKS } from './offlineData.ts';

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
  forceOffline = false
): Promise<ExternalBallActionResult> {
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
            message: 'يرجى السماح بصلاحية «الظهور فوق التطبيقات الأخرى» لتشغيل الكرة على الشاشة الرئيسية وباقي التطبيقات.',
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
          ? 'تم تشغيل الكرة العائمة خارج التطبيق! يمكنك الآن الخروج إلى الشاشة الرئيسية أو أي تطبيق آخر.'
          : 'تعذر تشغيل الكرة العائمة خارج التطبيق.',
      };
    } catch {
      return {
        success: false,
        mode: 'android',
        running: false,
        message: 'حدث خطأ أثناء تشغيل خدمة الكرة العائمة على أندرويد.',
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
          message: 'النافذة العائمة تعمل بالفعل خارج التطبيق.',
        };
      }

      const pipApi = (window as unknown as {
        documentPictureInPicture: {
          requestWindow: (opts: { width: number; height: number }) => Promise<Window>;
        };
      }).documentPictureInPicture;

      const pipWin = await pipApi.requestWindow({ width: 350, height: 340 });
      activePipWindow = pipWin;
      buildPipTranslatorUi(pipWin, targetLang, forceOffline);

      pipWin.addEventListener('pagehide', () => {
        activePipWindow = null;
        emitExternalBallChanged();
      });

      emitExternalBallChanged();
      return {
        success: true,
        mode: 'pip',
        running: true,
        message: 'تم فتح نافذة الكرة العائمة خارج التطبيق (تظهر فوق جميع النوافذ والتطبيقات).',
      };
    } catch {
      return {
        success: false,
        mode: 'pip',
        running: false,
        message: 'لم يتم فتح النافذة العائمة — يرجى النقر مجدداً للسماح بها.',
      };
    }
  }

  return {
    success: false,
    mode: 'unsupported',
    running: false,
    message:
      'الظهور فوق الشاشة الرئيسية والتطبيقات الأخرى مدعوم مباشرة في تطبيق أندرويد (APK) أو في متصفحات Chrome الداعمة للنافذة العائمة.',
  };
}

export async function disableExternalFloatingBall(): Promise<ExternalBallActionResult> {
  if (isNativeAndroid()) {
    try {
      await FloatingBallOverlay.stopOverlay();
      emitExternalBallChanged();
      return {
        success: true,
        mode: 'android',
        running: false,
        message: 'تم إيقاف الكرة العائمة خارج التطبيق.',
      };
    } catch {
      return {
        success: false,
        mode: 'android',
        running: false,
        message: 'تعذر إيقاف الكرة العائمة.',
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
      message: 'تم إغلاق النافذة العائمة خارج التطبيق.',
    };
  }

  return {
    success: true,
    mode: isDocumentPiPSupported() ? 'pip' : 'unsupported',
    running: false,
    message: 'الكرة العائمة الخارجية متوقفة.',
  };
}

function buildPipTranslatorUi(pipWin: Window, initialTargetLang: string, forceOffline: boolean) {
  const doc = pipWin.document;
  doc.documentElement.dir = 'rtl';
  doc.documentElement.lang = 'ar';
  doc.title = 'كرة الترجمة العائمة';

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
  title.textContent = '🔮 كرة الترجمة (خارج التطبيق)';
  title.style.fontSize = '13px';
  title.style.color = '#67e8f9';

  const closeBtn = doc.createElement('button');
  closeBtn.textContent = 'عدم تفعيل ✕';
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
    opt.textContent = `${pack.flag} ${pack.nameAr}`;
    if (pack.code === initialTargetLang) opt.selected = true;
    select.appendChild(opt);
  }
  card.appendChild(select);

  const input = doc.createElement('textarea');
  input.rows = 3;
  input.placeholder = 'اكتب أو الصق أي نص لترجمته فوراً...';
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
  btn.textContent = '⚡ ترجم الآن';
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
  output.textContent = 'الترجمة ستظهر هنا...';
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
    output.textContent = 'جاري الترجمة...';
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
