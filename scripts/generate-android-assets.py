from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
source = Image.open(ROOT / "client/public/icons/home-icon-512.png").convert("RGBA")
brand = (47, 111, 104, 255)
cream = (247, 245, 239, 255)

densities = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192,
}
for density, size in densities.items():
    out_dir = ROOT / "android/app/src/main/res" / f"mipmap-{density}"
    out_dir.mkdir(parents=True, exist_ok=True)
    icon = source.resize((size, size), Image.Resampling.LANCZOS)
    icon.save(out_dir / "ic_launcher.png", optimize=True)
    icon.save(out_dir / "ic_launcher_round.png", optimize=True)
    # Adaptive foreground keeps the same recognizable house mark with transparent padding.
    foreground = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mark = source.resize((int(size * 0.72), int(size * 0.72)), Image.Resampling.LANCZOS)
    foreground.alpha_composite(mark, ((size - mark.width) // 2, (size - mark.height) // 2))
    foreground.save(out_dir / "ic_launcher_foreground.png", optimize=True)

# Adaptive icon background and foreground vector files are referenced by Android resources.
res = ROOT / "android/app/src/main/res"
(res / "drawable/ic_launcher_background.xml").write_text(
    '<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">\n'
    '    <solid android:color="#2F6F68" />\n'
    '</shape>\n', encoding="utf-8"
)
(res / "drawable-v24/ic_launcher_foreground.xml").write_text(
    '<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108">\n'
    '    <path android:fillColor="#F7F5EF" android:pathData="M18,50 L54,20 L90,50 L84,50 L84,78 C84,84 80,88 74,88 L34,88 C28,88 24,84 24,78 L24,50 Z" />\n'
    '    <path android:fillColor="#E8BB5B" android:pathData="M46,62 L62,62 L62,88 L46,88 Z" />\n'
    '</vector>\n', encoding="utf-8"
)

for path in [res / "drawable/splash.png"] + list(res.glob("drawable-*/splash.png")):
    canvas = Image.new("RGBA", (480, 320), brand)
    mark = source.resize((170, 170), Image.Resampling.LANCZOS)
    # Make the existing square artwork blend into the brand background.
    mark = mark.resize((150, 150), Image.Resampling.LANCZOS)
    canvas.alpha_composite(mark, ((480 - mark.width) // 2, (320 - mark.height) // 2))
    canvas.convert("RGB").save(path, optimize=True)
