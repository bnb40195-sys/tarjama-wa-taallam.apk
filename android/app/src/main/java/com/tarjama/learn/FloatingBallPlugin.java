package com.tarjama.learn;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "FloatingBallOverlay")
public class FloatingBallPlugin extends Plugin {

    @PluginMethod
    public void checkOverlayPermission(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", canDrawOverlays());
        ret.put("running", FloatingBallService.isRunning());
        call.resolve(ret);
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        if (canDrawOverlays()) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getContext().getPackageName())
            );
            startActivityForResult(call, intent, "handleOverlayPermissionResult");
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        }
    }

    @ActivityCallback
    private void handleOverlayPermissionResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }
        JSObject ret = new JSObject();
        ret.put("granted", canDrawOverlays());
        call.resolve(ret);
    }

    @PluginMethod
    public void startOverlay(PluginCall call) {
        if (!canDrawOverlays()) {
            JSObject ret = new JSObject();
            ret.put("started", false);
            ret.put("needsPermission", true);
            ret.put("running", false);
            call.resolve(ret);
            return;
        }

        String targetLang = call.getString("targetLang", "ar");
        Intent serviceIntent = new Intent(getContext(), FloatingBallService.class);
        serviceIntent.setAction(FloatingBallService.ACTION_START);
        serviceIntent.putExtra(FloatingBallService.EXTRA_TARGET_LANG, targetLang);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(serviceIntent);
        } else {
            getContext().startService(serviceIntent);
        }

        JSObject ret = new JSObject();
        ret.put("started", true);
        ret.put("needsPermission", false);
        ret.put("running", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void stopOverlay(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), FloatingBallService.class);
        serviceIntent.setAction(FloatingBallService.ACTION_STOP);
        getContext().stopService(serviceIntent);

        JSObject ret = new JSObject();
        ret.put("stopped", true);
        ret.put("running", false);
        call.resolve(ret);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("permissionGranted", canDrawOverlays());
        ret.put("running", FloatingBallService.isRunning());
        call.resolve(ret);
    }

    private boolean canDrawOverlays() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(getContext());
        }
        return true;
    }
}
