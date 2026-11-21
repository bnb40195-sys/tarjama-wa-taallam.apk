package com.tarjama.learn;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.IBinder;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Locale;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;

public class FloatingBallService extends Service {

    public static final String ACTION_START = "com.tarjama.learn.ACTION_START_FLOATING_BALL";
    public static final String ACTION_STOP = "com.tarjama.learn.ACTION_STOP_FLOATING_BALL";
    public static final String EXTRA_TARGET_LANG = "targetLang";

    private static final String CHANNEL_ID = "tarjama_floating_ball_channel";
    private static final int NOTIFICATION_ID = 4091;

    private static volatile boolean running = false;

    public static boolean isRunning() {
        return running;
    }

    private WindowManager windowManager;
    private View ballView;
    private View panelView;
    private WindowManager.LayoutParams ballParams;
    private WindowManager.LayoutParams panelParams;
    private boolean panelVisible = false;

    private String targetLang = "ar";
    private EditText inputEditText;
    private TextView resultTextView;
    private TextView targetLangButton;

    // Offline vocabulary lookup loaded from APK bundled JSON packs
    private final Map<String, Map<String, String>> dictionaryIndex = new HashMap<>();
    private boolean dictionaryLoaded = false;

    private static final String[][] TARGET_LANGS = {
        { "ar", "🇸🇦 العربية" },
        { "en", "🇬🇧 English" },
        { "fr", "🇫🇷 Français" },
        { "es", "🇪🇸 Español" },
        { "de", "🇩🇪 Deutsch" },
        { "tr", "🇹🇷 Türkçe" },
    };
    private int currentLangIndex = 0;

    @Override
    public void onCreate() {
        super.onCreate();
        running = true;
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        createNotificationChannel();
        startForegroundCompat();
        loadOfflineDictionariesAsync();
        createFloatingBallView();
        createOverlayPanelView();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            if (ACTION_STOP.equals(intent.getAction())) {
                stopSelf();
                return START_NOT_STICKY;
            }
            String reqLang = intent.getStringExtra(EXTRA_TARGET_LANG);
            if (!TextUtils.isEmpty(reqLang)) {
                setTargetLanguageByCode(reqLang);
            }
        }
        running = true;
        return START_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        running = false;
        removeViewsSafely();
        super.onDestroy();
    }

    private void removeViewsSafely() {
        try {
            if (panelVisible && panelView != null && windowManager != null) {
                windowManager.removeView(panelView);
                panelVisible = false;
            }
        } catch (Exception ignored) {}
        try {
            if (ballView != null && windowManager != null) {
                windowManager.removeView(ballView);
                ballView = null;
            }
        } catch (Exception ignored) {}
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "كرة الترجمة العائمة",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("تُبقي كرة الترجمة العائمة نشطة فوق الشاشة الرئيسية والتطبيقات الأخرى");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void startForegroundCompat() {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent contentIntent = PendingIntent.getActivity(this, 0, openIntent, pendingFlags);

        Intent stopIntent = new Intent(this, FloatingBallService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPendingIntent = PendingIntent.getService(this, 1, stopIntent, pendingFlags);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("ترجمة وتعلّم — الكرة العائمة نشطة")
            .setContentText("اسحب الكرة أو انقر عليها للترجمة فوق أي تطبيق")
            .setSmallIcon(android.R.drawable.ic_menu_search)
            .setContentIntent(contentIntent)
            .setOngoing(true)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "إيقاف الكرة", stopPendingIntent)
            .build();

        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private int getOverlayWindowType() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        }
        return WindowManager.LayoutParams.TYPE_PHONE;
    }

    private int dp(int value) {
        return (int) TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            value,
            getResources().getDisplayMetrics()
        );
    }

    private void createFloatingBallView() {
        int sizePx = dp(58);
        ballParams = new WindowManager.LayoutParams(
            sizePx,
            sizePx,
            getOverlayWindowType(),
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        );
        ballParams.gravity = Gravity.TOP | Gravity.LEFT;
        ballParams.x = dp(18);
        ballParams.y = dp(180);

        LinearLayout container = new LinearLayout(this);
        container.setOrientation(LinearLayout.VERTICAL);
        container.setGravity(Gravity.CENTER);

        GradientDrawable circleBg = new GradientDrawable();
        circleBg.setShape(GradientDrawable.OVAL);
        circleBg.setColors(new int[] { Color.parseColor("#0F172A"), Color.parseColor("#1E3A8A") });
        circleBg.setGradientType(GradientDrawable.LINEAR_GRADIENT);
        circleBg.setStroke(dp(2), Color.parseColor("#22D3EE"));
        container.setBackground(circleBg);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            container.setElevation(dp(8));
        }

        TextView icon = new TextView(this);
        icon.setText("🔮");
        icon.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
        icon.setGravity(Gravity.CENTER);

        TextView label = new TextView(this);
        label.setText("ترجمة");
        label.setTextColor(Color.parseColor("#67E8F9"));
        label.setTextSize(TypedValue.COMPLEX_UNIT_SP, 9);
        label.setTypeface(null, Typeface.BOLD);
        label.setGravity(Gravity.CENTER);

        container.addView(icon);
        container.addView(label);

        container.setOnTouchListener(new View.OnTouchListener() {
            private int initialX;
            private int initialY;
            private float initialTouchX;
            private float initialTouchY;
            private boolean isDrag;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        initialX = ballParams.x;
                        initialY = ballParams.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        isDrag = false;
                        return true;

                    case MotionEvent.ACTION_MOVE:
                        float dx = event.getRawX() - initialTouchX;
                        float dy = event.getRawY() - initialTouchY;
                        if (Math.hypot(dx, dy) > 12) {
                            isDrag = true;
                        }
                        if (isDrag) {
                            ballParams.x = initialX + (int) dx;
                            ballParams.y = initialY + (int) dy;
                            try {
                                windowManager.updateViewLayout(ballView, ballParams);
                            } catch (Exception ignored) {}
                        }
                        return true;

                    case MotionEvent.ACTION_UP:
                        if (!isDrag) {
                            toggleOverlayPanel();
                        }
                        return true;
                }
                return false;
            }
        });

        ballView = container;
        windowManager.addView(ballView, ballParams);
    }

    private void createOverlayPanelView() {
        int panelWidth = dp(310);
        panelParams = new WindowManager.LayoutParams(
            panelWidth,
            WindowManager.LayoutParams.WRAP_CONTENT,
            getOverlayWindowType(),
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL | WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
            PixelFormat.TRANSLUCENT
        );
        panelParams.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
        panelParams.y = dp(90);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(14), dp(14), dp(14), dp(14));

        GradientDrawable panelBg = new GradientDrawable();
        panelBg.setCornerRadius(dp(18));
        panelBg.setColor(Color.parseColor("#F50F172A"));
        panelBg.setStroke(dp(1), Color.parseColor("#06B6D4"));
        root.setBackground(panelBg);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            root.setElevation(dp(12));
        }

        // Top Header Row
        LinearLayout headerRow = new LinearLayout(this);
        headerRow.setOrientation(LinearLayout.HORIZONTAL);
        headerRow.setGravity(Gravity.CENTER_VERTICAL);

        TextView title = new TextView(this);
        title.setText("🔮 كرة الترجمة (خارج التطبيق)");
        title.setTextColor(Color.parseColor("#67E8F9"));
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        title.setTypeface(null, Typeface.BOLD);
        LinearLayout.LayoutParams titleLp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        title.setLayoutParams(titleLp);

        Button openAppBtn = createPillButton("التطبيق", "#1E293B", "#38BDF8");
        openAppBtn.setOnClickListener(v -> {
            hideOverlayPanel();
            Intent openIntent = new Intent(this, MainActivity.class);
            openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            startActivity(openIntent);
        });

        Button closePanelBtn = createPillButton("✕", "#1E293B", "#CBD5E1");
        closePanelBtn.setOnClickListener(v -> hideOverlayPanel());

        headerRow.addView(title);
        headerRow.addView(openAppBtn);
        headerRow.addView(spaceView(6));
        headerRow.addView(closePanelBtn);
        root.addView(headerRow);

        // Activation / Deactivation Bar
        LinearLayout statusBar = new LinearLayout(this);
        statusBar.setOrientation(LinearLayout.HORIZONTAL);
        statusBar.setGravity(Gravity.CENTER_VERTICAL);
        statusBar.setPadding(dp(10), dp(8), dp(10), dp(8));
        GradientDrawable statusBg = new GradientDrawable();
        statusBg.setCornerRadius(dp(12));
        statusBg.setColor(Color.parseColor("#020617"));
        statusBg.setStroke(dp(1), Color.parseColor("#1E293B"));
        statusBar.setBackground(statusBg);
        LinearLayout.LayoutParams statusLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        statusLp.topMargin = dp(8);
        statusBar.setLayoutParams(statusLp);

        TextView statusText = new TextView(this);
        statusText.setText("حالة الكرة: مفعّلة");
        statusText.setTextColor(Color.parseColor("#6EE7B7"));
        statusText.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        statusText.setTypeface(null, Typeface.BOLD);
        statusText.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

        Button disableBallBtn = createPillButton("عدم تفعيل", "#7F1D1D", "#FECACA");
        disableBallBtn.setOnClickListener(v -> {
            Toast.makeText(this, "تم إيقاف الكرة العائمة", Toast.LENGTH_SHORT).show();
            stopSelf();
        });

        statusBar.addView(statusText);
        statusBar.addView(disableBallBtn);
        root.addView(statusBar);

        // Target Language Row
        LinearLayout langRow = new LinearLayout(this);
        langRow.setOrientation(LinearLayout.HORIZONTAL);
        langRow.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams langRowLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        langRowLp.topMargin = dp(8);
        langRow.setLayoutParams(langRowLp);

        TextView langLabel = new TextView(this);
        langLabel.setText("الترجمة إلى:");
        langLabel.setTextColor(Color.parseColor("#94A3B8"));
        langLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        langLabel.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

        targetLangButton = createPillButton(TARGET_LANGS[currentLangIndex][1], "#0F172A", "#67E8F9");
        targetLangButton.setOnClickListener(v -> {
            currentLangIndex = (currentLangIndex + 1) % TARGET_LANGS.length;
            targetLang = TARGET_LANGS[currentLangIndex][0];
            targetLangButton.setText(TARGET_LANGS[currentLangIndex][1] + " ▾");
        });
        targetLangButton.setText(TARGET_LANGS[currentLangIndex][1] + " ▾");

        langRow.addView(langLabel);
        langRow.addView(targetLangButton);
        root.addView(langRow);

        // Input EditText
        inputEditText = new EditText(this);
        inputEditText.setHint("اكتب أو الصق نصاً لترجمته...");
        inputEditText.setHintTextColor(Color.parseColor("#64748B"));
        inputEditText.setTextColor(Color.WHITE);
        inputEditText.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        inputEditText.setPadding(dp(10), dp(10), dp(10), dp(10));
        inputEditText.setMaxLines(3);
        GradientDrawable inputBg = new GradientDrawable();
        inputBg.setCornerRadius(dp(12));
        inputBg.setColor(Color.parseColor("#020617"));
        inputBg.setStroke(dp(1), Color.parseColor("#334155"));
        inputEditText.setBackground(inputBg);
        LinearLayout.LayoutParams inputLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        inputLp.topMargin = dp(8);
        inputEditText.setLayoutParams(inputLp);
        root.addView(inputEditText);

        // Action Buttons Row (Clipboard Translate + Translate)
        LinearLayout actionsRow = new LinearLayout(this);
        actionsRow.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams actionsLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        actionsLp.topMargin = dp(8);
        actionsRow.setLayoutParams(actionsLp);

        Button pasteTranslateBtn = createPillButton("لصق من الحافظة 📋", "#1E293B", "#E2E8F0");
        pasteTranslateBtn.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        pasteTranslateBtn.setOnClickListener(v -> translateFromClipboard());

        Button translateBtn = createPillButton("ترجم ⚡", "#0284C7", "#FFFFFF");
        translateBtn.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        translateBtn.setOnClickListener(v -> performOverlayTranslation(inputEditText.getText().toString()));

        actionsRow.addView(pasteTranslateBtn);
        actionsRow.addView(spaceView(8));
        actionsRow.addView(translateBtn);
        root.addView(actionsRow);

        // Result Scroll Box
        ScrollView resultScroll = new ScrollView(this);
        LinearLayout.LayoutParams scrollLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            dp(96)
        );
        scrollLp.topMargin = dp(8);
        resultScroll.setLayoutParams(scrollLp);
        GradientDrawable resBg = new GradientDrawable();
        resBg.setCornerRadius(dp(12));
        resBg.setColor(Color.parseColor("#0B1120"));
        resBg.setStroke(dp(1), Color.parseColor("#164E63"));
        resultScroll.setBackground(resBg);
        resultScroll.setPadding(dp(10), dp(8), dp(10), dp(8));

        resultTextView = new TextView(this);
        resultTextView.setText("الترجمة ستظهر هنا (تعمل بدون إنترنت فوق أي تطبيق).");
        resultTextView.setTextColor(Color.parseColor("#E2E8F0"));
        resultTextView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        resultScroll.addView(resultTextView);
        root.addView(resultScroll);

        // Bottom Copy Row
        LinearLayout copyRow = new LinearLayout(this);
        copyRow.setOrientation(LinearLayout.HORIZONTAL);
        copyRow.setGravity(Gravity.END);
        LinearLayout.LayoutParams copyRowLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        copyRowLp.topMargin = dp(6);
        copyRow.setLayoutParams(copyRowLp);

        Button copyBtn = createPillButton("نسخ الترجمة", "#065F46", "#D1FAE5");
        copyBtn.setOnClickListener(v -> {
            String out = resultTextView.getText().toString().trim();
            if (!out.isEmpty()) {
                ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                if (cm != null) {
                    cm.setPrimaryClip(ClipData.newPlainText("translation", out));
                    Toast.makeText(this, "تم نسخ الترجمة", Toast.LENGTH_SHORT).show();
                }
            }
        });
        copyRow.addView(copyBtn);
        root.addView(copyRow);

        panelView = root;
    }

    private Button createPillButton(String text, String bgHex, String textHex) {
        Button btn = new Button(this);
        btn.setText(text);
        btn.setTextColor(Color.parseColor(textHex));
        btn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        btn.setTypeface(null, Typeface.BOLD);
        btn.setAllCaps(false);
        btn.setPadding(dp(10), dp(6), dp(10), dp(6));
        btn.setMinHeight(0);
        btn.setMinimumHeight(0);
        GradientDrawable bg = new GradientDrawable();
        bg.setCornerRadius(dp(10));
        bg.setColor(Color.parseColor(bgHex));
        btn.setBackground(bg);
        return btn;
    }

    private View spaceView(int widthDp) {
        View v = new View(this);
        v.setLayoutParams(new LinearLayout.LayoutParams(dp(widthDp), 1));
        return v;
    }

    private void setTargetLanguageByCode(String code) {
        for (int i = 0; i < TARGET_LANGS.length; i++) {
            if (TARGET_LANGS[i][0].equalsIgnoreCase(code)) {
                currentLangIndex = i;
                targetLang = TARGET_LANGS[i][0];
                if (targetLangButton != null) {
                    targetLangButton.setText(TARGET_LANGS[i][1] + " ▾");
                }
                return;
            }
        }
    }

    private void toggleOverlayPanel() {
        if (panelVisible) {
            hideOverlayPanel();
        } else {
            showOverlayPanel();
        }
    }

    private void showOverlayPanel() {
        if (panelVisible || panelView == null) return;
        try {
            windowManager.addView(panelView, panelParams);
            panelVisible = true;
        } catch (Exception ignored) {}
    }

    private void hideOverlayPanel() {
        if (!panelVisible || panelView == null) return;
        try {
            windowManager.removeView(panelView);
            panelVisible = false;
        } catch (Exception ignored) {}
    }

    private void translateFromClipboard() {
        ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        if (cm != null && cm.hasPrimaryClip()) {
            ClipData clip = cm.getPrimaryClip();
            if (clip != null && clip.getItemCount() > 0 && clip.getItemAt(0).getText() != null) {
                String clipText = clip.getItemAt(0).getText().toString().trim();
                inputEditText.setText(clipText);
                performOverlayTranslation(clipText);
                return;
            }
        }
        Toast.makeText(this, "الحافظة فارغة حالياً", Toast.LENGTH_SHORT).show();
    }

    private void performOverlayTranslation(String rawInput) {
        String clean = rawInput == null ? "" : rawInput.trim();
        if (clean.isEmpty()) {
            resultTextView.setText("اكتب نصاً أو اضغط لصق من الحافظة للترجمة.");
            return;
        }
        String translated = translateUsingLocalDictionary(clean, targetLang);
        resultTextView.setText(translated);
    }

    private void loadOfflineDictionariesAsync() {
        new Thread(() -> {
            loadPackAsset("public/packs/pack_en.json");
            loadPackAsset("public/packs/pack_ar.json");
            dictionaryLoaded = true;
        }).start();
    }

    private void loadPackAsset(String assetPath) {
        try (InputStream is = getAssets().open(assetPath);
             BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            JSONObject root = new JSONObject(sb.toString());
            JSONArray vocab = root.optJSONArray("vocabulary");
            if (vocab == null) return;

            for (int i = 0; i < vocab.length(); i++) {
                JSONObject item = vocab.optJSONObject(i);
                if (item == null) continue;
                JSONObject translations = item.optJSONObject("translations");
                if (translations == null) continue;

                Map<String, String> langMap = new HashMap<>();
                Iterator<String> keys = translations.keys();
                while (keys.hasNext()) {
                    String code = keys.next();
                    String val = translations.optString(code, "").trim();
                    if (!val.isEmpty()) {
                        langMap.put(code, val);
                    }
                }
                if (langMap.isEmpty()) continue;

                for (String val : langMap.values()) {
                    String key = normalizeLookupKey(val);
                    if (!key.isEmpty() && !dictionaryIndex.containsKey(key)) {
                        dictionaryIndex.put(key, langMap);
                    }
                }
            }
        } catch (Exception ignored) {}
    }

    private String normalizeLookupKey(String s) {
        if (s == null) return "";
        return s.toLowerCase(Locale.ROOT)
            .replaceAll("[\\p{Punct}؟،؛]", " ")
            .replaceAll("\\s+", " ")
            .trim();
    }

    private String translateUsingLocalDictionary(String text, String destLang) {
        if (!dictionaryLoaded || dictionaryIndex.isEmpty()) {
            loadPackAsset("public/packs/pack_en.json");
            dictionaryLoaded = true;
        }
        String wholeKey = normalizeLookupKey(text);
        Map<String, String> exact = dictionaryIndex.get(wholeKey);
        if (exact != null && exact.containsKey(destLang)) {
            return exact.get(destLang);
        }

        // Token-by-token translation fallback
        String[] words = wholeKey.split(" ");
        StringBuilder out = new StringBuilder();
        int matched = 0;
        for (int i = 0; i < words.length; i++) {
            String w = words[i].trim();
            if (w.isEmpty()) continue;

            // Try 2-word phrase first
            if (i + 1 < words.length) {
                String two = w + " " + words[i + 1].trim();
                Map<String, String> twoMatch = dictionaryIndex.get(two);
                if (twoMatch != null && twoMatch.containsKey(destLang)) {
                    if (out.length() > 0) out.append(" ");
                    out.append(twoMatch.get(destLang));
                    matched++;
                    i++;
                    continue;
                }
            }

            Map<String, String> singleMatch = dictionaryIndex.get(w);
            if (singleMatch != null && singleMatch.containsKey(destLang)) {
                if (out.length() > 0) out.append(" ");
                out.append(singleMatch.get(destLang));
                matched++;
            } else {
                if (out.length() > 0) out.append(" ");
                out.append(w);
            }
        }
        return matched > 0 ? out.toString() : text;
    }
}
