#!/usr/bin/env bash
# Prepares a dedicated iPhone simulator for App Store screenshots.
# Run only on a dedicated screenshot simulator. Demo data goes into the app's
# simulator preferences, so no fixture code exists in the shipped app.
#
# usage: scripts/app-store-screenshots.sh [device-name-or-udid] [path/to/App.app]
set -euo pipefail

DEVICE="${1:-iPhone 17 Pro Max}"
APP="${2:-}"
BUNDLE_ID="com.sunpotflower.sumplesfire"
PREFIX="CapacitorStorage."
cd "$(dirname "$0")/.."

xcrun simctl boot "$DEVICE" 2>/dev/null || true
xcrun simctl bootstatus "$DEVICE" -b
if [[ -n "$APP" ]]; then
  xcrun simctl install "$DEVICE" "$APP"
fi
APP_DATA="$(xcrun simctl get_app_container "$DEVICE" "$BUNDLE_ID" data)"
PREFERENCES="$APP_DATA/Library/Preferences/$BUNDLE_ID.plist"
xcrun simctl terminate "$DEVICE" "$BUNDLE_ID" 2>/dev/null || true
xcrun simctl shutdown "$DEVICE"

# Write the app's sandbox on disk while the simulator is shut down to avoid a
# cached copy in its preferences daemon overwriting the fixture.
SCREENSHOT_SEEDS="$(node scripts/screenshot-seed.mjs)" \
SCREENSHOT_STREAK="$(node scripts/screenshot-seed.mjs streak)" \
python3 - "$PREFERENCES" "$PREFIX" <<'PY'
import os
import plistlib
import sys
import tempfile
from pathlib import Path

path, prefix = Path(sys.argv[1]), sys.argv[2]
values = plistlib.loads(path.read_bytes()) if path.exists() else {}
values[prefix + 'sumples-fire-seeds-v2'] = os.environ['SCREENSHOT_SEEDS']
values[prefix + 'sumples-fire-streak-v1'] = os.environ['SCREENSHOT_STREAK']
values[prefix + 'fire-task-sound-enabled-v1'] = 'true'
path.parent.mkdir(parents=True, exist_ok=True)
with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as temp:
    plistlib.dump(values, temp, fmt=plistlib.FMT_BINARY)
Path(temp.name).replace(path)
PY
xcrun simctl boot "$DEVICE"
xcrun simctl bootstatus "$DEVICE" -b
xcrun simctl ui "$DEVICE" appearance light

# Apple's marketing status bar: 9:41, full battery and signal.
xcrun simctl status_bar "$DEVICE" override --time "9:41" --batteryState discharging --batteryLevel 100 \
  --cellularMode active --cellularBars 4 --wifiBars 3 --dataNetwork wifi

xcrun simctl launch "$DEVICE" "$BUNDLE_ID"
echo "Ready for the AppStoreQA screenshot test on $DEVICE."
