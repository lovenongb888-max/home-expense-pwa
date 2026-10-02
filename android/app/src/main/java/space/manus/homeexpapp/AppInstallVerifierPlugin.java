package space.manus.homeexpapp;

import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.security.MessageDigest;

@CapacitorPlugin(name = "AppInstallVerifier")
public class AppInstallVerifierPlugin extends Plugin {
    @PluginMethod
    public void getInstallInfo(PluginCall call) {
        try {
            String packageName = getContext().getPackageName();
            PackageManager packageManager = getContext().getPackageManager();
            PackageInfo packageInfo;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                packageInfo = packageManager.getPackageInfo(packageName, PackageManager.GET_SIGNING_CERTIFICATES);
            } else {
                packageInfo = packageManager.getPackageInfo(packageName, PackageManager.GET_SIGNATURES);
            }

            Signature[] signatures;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && packageInfo.signingInfo != null) {
                signatures = packageInfo.signingInfo.hasMultipleSigners()
                        ? packageInfo.signingInfo.getApkContentsSigners()
                        : packageInfo.signingInfo.getSigningCertificateHistory();
            } else {
                signatures = packageInfo.signatures;
            }

            JSObject result = new JSObject();
            result.put("packageName", packageName);
            result.put("versionName", packageInfo.versionName);
            result.put("versionCode", Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ? packageInfo.getLongVersionCode() : packageInfo.versionCode);
            result.put("installerPackageName", packageManager.getInstallerPackageName(packageName));
            result.put("signatureSha256", signatures != null && signatures.length > 0 ? sha256(signatures[0].toByteArray()) : null);
            result.put("isInstalled", true);
            call.resolve(result);
        } catch (Exception error) {
            call.reject(error.getMessage() == null ? "ตรวจสอบการติดตั้งไม่สำเร็จ" : error.getMessage());
        }
    }

    private String sha256(byte[] bytes) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
        StringBuilder output = new StringBuilder();
        for (byte value : digest) output.append(String.format("%02X", value));
        return output.toString();
    }
}
