package space.manus.homeexpapp;

import android.graphics.Color;
import android.os.Build;
import android.view.View;

import com.getcapacitor.BridgeActivity;
import androidx.core.view.WindowCompat;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(NativeFilePickerPlugin.class);
        registerPlugin(AppInstallVerifierPlugin.class);
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        getWindow().setStatusBarColor(Color.rgb(247, 245, 239));
        getWindow().setNavigationBarColor(Color.rgb(247, 245, 239));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
        }
    }
}
