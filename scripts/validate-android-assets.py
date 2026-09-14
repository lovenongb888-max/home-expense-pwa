from pathlib import Path
from xml.etree import ElementTree

root = Path(__file__).resolve().parents[1]
xml_files = [
    root / "android/app/src/main/AndroidManifest.xml",
    root / "android/app/src/main/res/values/styles.xml",
    root / "android/app/src/main/res/values/colors.xml",
    root / "android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml",
]
for path in xml_files:
    ElementTree.parse(path)
    print(f"valid XML: {path.relative_to(root)}")
for path in [
    root / "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png",
    root / "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png",
    root / "android/app/src/main/res/drawable/splash.png",
]:
    if not path.exists() or path.stat().st_size == 0:
        raise SystemExit(f"missing asset: {path}")
    print(f"valid asset: {path.relative_to(root)} ({path.stat().st_size} bytes)")
