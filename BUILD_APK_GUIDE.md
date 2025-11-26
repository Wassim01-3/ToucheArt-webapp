# Guide to Build APK for ToucheArt

## Prerequisites

1. **Android Studio** installed with:
   - Android SDK (API level 24 or higher)
   - Android SDK Build-Tools
   - Android NDK (will be downloaded automatically if needed)

2. **Java Development Kit (JDK)** - Version 11 or higher

3. **Node.js and npm** - Already installed ✓

## Step-by-Step Instructions

### Step 1: Generate Android Native Project (if not already done)

If you don't have an `android` folder, run:
```bash
npx expo prebuild --platform android
```

This creates the native Android project structure.

### Step 2: Configure Android SDK Location

Create or update the file `android/local.properties` with your Android SDK path:

**Windows:**
```
sdk.dir=C\:\\Users\\PC\\AppData\\Local\\Android\\Sdk
```

**Note:** Replace the path with your actual Android SDK location if different. Common locations:
- Windows: `C:\Users\YourUsername\AppData\Local\Android\Sdk`
- Or check in Android Studio: File → Settings → Appearance & Behavior → System Settings → Android SDK

### Step 3: Build the APK

Navigate to the android directory and run one of these commands:

**For Debug APK (unsigned, for testing):**
```bash
cd android
.\gradlew.bat assembleDebug
```

**For Release APK (signed with debug keystore, for distribution):**
```bash
cd android
.\gradlew.bat assembleRelease
```

**Note:** The first build will take longer (10-30 minutes) as it downloads dependencies and compiles everything. Subsequent builds will be faster.

### Step 4: Find Your APK

After the build completes successfully, your APK will be located at:

**Debug APK:**
```
android\app\build\outputs\apk\debug\app-debug.apk
```

**Release APK:**
```
android\app\build\outputs\apk\release\app-release.apk
```

### Step 5: Install on Device

You can install the APK on an Android device by:
1. Transferring the APK file to your Android device
2. Enabling "Install from Unknown Sources" in device settings
3. Opening the APK file on your device to install

## Troubleshooting

### Issue: "SDK location not found"
- Make sure `android/local.properties` exists with the correct SDK path
- Verify your Android SDK is installed via Android Studio

### Issue: "NDK not found" or "NDK did not have a source.properties file"
**Solution 1: Delete incomplete NDK and let Gradle re-download**
1. Delete the incomplete NDK folder:
   ```bash
   # Windows PowerShell
   Remove-Item -Recurse -Force "C:\Users\PC\AppData\Local\Android\Sdk\ndk\27.1.12297006"
   ```
2. Run the build again - Gradle will download the NDK properly

**Solution 2: Install NDK via Android Studio**
1. Open Android Studio
2. Go to: **Tools → SDK Manager** (or **File → Settings → Appearance & Behavior → System Settings → Android SDK**)
3. Click on the **SDK Tools** tab
4. Check **NDK (Side by side)** and select version **27.1.12297006**
5. Click **Apply** to install
6. Run the build again

### Issue: Build takes too long
- This is normal for the first build
- Subsequent builds will be much faster
- You can use `--no-daemon` flag if you encounter daemon issues

### Issue: Out of memory errors
- Increase Gradle memory: Create/edit `android/gradle.properties` and add:
  ```
  org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
  ```

## For Production Release (Optional)

If you want to create a signed APK for Google Play Store:

1. Generate a keystore:
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Update `android/app/build.gradle` to use your keystore (replace the release signingConfig)

3. Build the release APK again

## Quick Command Summary

```bash
# 1. Generate Android project (if needed)
npx expo prebuild --platform android

# 2. Build debug APK
cd android
.\gradlew.bat assembleDebug

# 3. Find APK at: android\app\build\outputs\apk\debug\app-debug.apk
```

Good luck with your build! 🚀

