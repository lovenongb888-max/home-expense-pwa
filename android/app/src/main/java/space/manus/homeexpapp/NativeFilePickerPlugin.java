package space.manus.homeexpapp;

import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.util.Base64;

import com.getcapacitor.JSObject;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

@CapacitorPlugin(name = "NativeFilePicker")
public class NativeFilePickerPlugin extends Plugin {
    private static final int FILE_PICKER_REQUEST = 4201;

    @PluginMethod
    public void pickReceipt(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"image/jpeg", "image/png", "image/webp", "application/pdf"});
        startActivityForResult(call, intent, "filePickerResult");
    }

    @ActivityCallback
    private void filePickerResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result == null || result.getResultCode() != android.app.Activity.RESULT_OK || result.getData() == null) {
            call.reject("ไม่ได้เลือกไฟล์");
            return;
        }
        Uri uri = result.getData().getData();
        if (uri == null) {
            call.reject("ไม่พบไฟล์ที่เลือก");
            return;
        }
        try {
            String mimeType = getContext().getContentResolver().getType(uri);
            if (mimeType == null) mimeType = "application/octet-stream";
            if (!(mimeType.equals("image/jpeg") || mimeType.equals("image/png") || mimeType.equals("image/webp") || mimeType.equals("application/pdf"))) {
                call.reject("รองรับเฉพาะ JPG, PNG, WebP และ PDF");
                return;
            }
            String fileName = queryFileName(uri);
            InputStream input = getContext().getContentResolver().openInputStream(uri);
            if (input == null) throw new IllegalStateException("เปิดไฟล์ไม่ได้");
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int read;
            long total = 0;
            while ((read = input.read(buffer)) != -1) {
                total += read;
                if (total > 6 * 1024 * 1024) throw new IllegalArgumentException("ไฟล์ใหญ่เกิน 6 MB");
                output.write(buffer, 0, read);
            }
            input.close();
            JSObject response = new JSObject();
            response.put("fileName", fileName);
            response.put("mimeType", mimeType);
            response.put("base64", Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP));
            call.resolve(response);
        } catch (Exception error) {
            call.reject(error.getMessage() == null ? "อ่านไฟล์ไม่สำเร็จ" : error.getMessage());
        }
    }

    private String queryFileName(Uri uri) {
        Cursor cursor = getContext().getContentResolver().query(uri, null, null, null, null);
        if (cursor != null) {
            try {
                int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (cursor.moveToFirst() && index >= 0) return cursor.getString(index);
            } finally {
                cursor.close();
            }
        }
        return "receipt";
    }
}
