#!/usr/bin/env bash
# Prepares a simulator for App Store screenshots (6.9" = iPhone 17 Pro Max,
# 1320x2868). Demo data goes straight into the simulator's UserDefaults, so
# no fixture code exists in the shipped app.
#
# usage: scripts/app-store-screenshots.sh [device-name-or-udid] [path/to/App.app]
set -euo pipefail

DEVICE="${1:-iPhone 17 Pro Max}"
APP="${2:-}"
BUNDLE_ID="com.sunpotflower.sumplesfire"
PREFIX="CapacitorStorage."
cd "$(dirname "$0")/.."

xcrun simctl boot "$DEVICE" 2>/dev/null || true
open -a Simulator
if [[ -n "$APP" ]]; then
  xcrun simctl install "$DEVICE" "$APP"
fi
xcrun simctl terminate "$DEVICE" "$BUNDLE_ID" 2>/dev/null || true

xcrun simctl spawn "$DEVICE" defaults write "$BUNDLE_ID" "${PREFIX}sumples-fire-seeds-v2" -string "$(node scripts/screenshot-seed.mjs)"
xcrun simctl spawn "$DEVICE" defaults write "$BUNDLE_ID" "${PREFIX}sumples-fire-streak-v1" -string "$(node scripts/screenshot-seed.mjs streak)"
xcrun simctl spawn "$DEVICE" defaults write "$BUNDLE_ID" "${PREFIX}fire-task-sound-enabled-v1" -string "true"

# Apple's marketing status bar: 9:41, full battery and signal.
xcrun simctl status_bar "$DEVICE" override --time "9:41" --batteryState charged --batteryLevel 100 \
  --cellularMode active --cellularBars 4 --wifiBars 3 --dataNetwork wifi

xcrun simctl launch "$DEVICE" "$BUNDLE_ID"
echo "Ready. Capture each screen with:"
echo "  xcrun simctl io \"$DEVICE\" screenshot docs/app-store-screenshots/01-home.png"
