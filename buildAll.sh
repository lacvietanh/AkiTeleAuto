#!/bin/bash
cd `dirname "$0"`
npm run build
electron-builder --linux --x64
electron-builder --win --x64
electron-builder --mac --x64
electron-builder --mac --arm64
