# APK Signing Guide for ToucheArt

## Current Status

✅ **APK renamed:** `ToucheArt.apk` is ready in your project root  
✅ **APK is signed:** Currently signed with a **debug certificate**

## About APK Signing

Your APK is already signed, but with a **debug certificate**. This means:

- ✅ **Can be installed** on Android devices
- ✅ **Works for testing** and personal use
- ❌ **Cannot be published** to Google Play Store
- ❌ **Not suitable** for production distribution

## Signing Options

### Option 1: Keep Debug Signature (Current)
**Use this if:** You just want to test the app or share it with friends

- Already done ✓
- APK is ready to install
- No further action needed

### Option 2: Create Production Keystore (Recommended for Play Store)
**Use this if:** You want to publish to Google Play Store or distribute professionally

#### Quick Method: Use the Signing Script

I've created a PowerShell script for you:

```powershell
.\sign-apk.ps1
```

This script will:
1. Create a production keystore (if it doesn't exist)
2. Sign your `ToucheArt.apk` with the production keystore
3. Verify the signature

#### Manual Method: Create Keystore and Sign

**Step 1: Generate a production keystore**
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore android/app/toucheart-release-key.keystore -alias toucheart-key -keyalg RSA -keysize 2048 -validity 10000
```

You'll be prompted for:
- Keystore password (remember this!)
- Key password (can be same as keystore)
- Your name, organization, etc.

**Step 2: Sign the APK**
```bash
# Find your apksigner (usually in Android SDK build-tools)
$apksigner = "C:\Users\PC\AppData\Local\Android\Sdk\build-tools\[VERSION]\apksigner.bat"

# Sign the APK
& $apksigner sign --ks android/app/toucheart-release-key.keystore --ks-key-alias toucheart-key --out ToucheArt-signed.apk ToucheArt.apk
```

**Step 3: Verify signature**
```bash
& $apksigner verify --print-certs ToucheArt-signed.apk
```

### Option 3: Configure Gradle for Auto-Signing (Best for Future Builds)

If you want future builds to automatically use your production keystore:

1. **Create the keystore** (see Option 2, Step 1)

2. **Create `android/keystore.properties`**:
   ```
   storePassword=YOUR_STORE_PASSWORD
   keyPassword=YOUR_KEY_PASSWORD
   keyAlias=toucheart-key
   storeFile=app/toucheart-release-key.keystore
   ```

3. **Update `android/app/build.gradle`**:
   ```gradle
   def keystorePropertiesFile = rootProject.file("keystore.properties")
   def keystoreProperties = new Properties()
   if (keystorePropertiesFile.exists()) {
       keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
   }

   android {
       // ... existing config ...
       
       signingConfigs {
           debug {
               // ... existing debug config ...
           }
           release {
               if (keystorePropertiesFile.exists()) {
                   storeFile file(keystoreProperties['storeFile'])
                   storePassword keystoreProperties['storePassword']
                   keyAlias keystoreProperties['keyAlias']
                   keyPassword keystoreProperties['keyPassword']
               }
           }
       }
       
       buildTypes {
           release {
               signingConfig signingConfigs.release  // Change from debug to release
               // ... rest of config ...
           }
       }
   }
   ```

4. **Rebuild the APK:**
   ```bash
   cd android
   .\gradlew.bat assembleRelease
   ```

## Important Notes

⚠️ **Keep your keystore safe!**
- Store it securely (backup in multiple places)
- Never lose the keystore or passwords
- You'll need the same keystore for all future updates on Google Play Store
- If you lose it, you cannot update your app on Play Store

## Current APK Location

- **File:** `ToucheArt.apk` (in project root)
- **Size:** ~102 MB
- **Signed:** Yes (debug certificate)
- **Ready for:** Testing and personal use

## Next Steps

1. **For testing:** Your APK is ready! Just install it on a device.

2. **For Play Store:** 
   - Create a production keystore
   - Sign the APK with the production keystore
   - Upload to Google Play Console

3. **For future builds:**
   - Set up auto-signing in Gradle (Option 3)
   - All future release builds will be production-signed automatically

## Quick Commands

```bash
# Check if APK is signed
$apksigner = "C:\Users\PC\AppData\Local\Android\Sdk\build-tools\[VERSION]\apksigner.bat"
& $apksigner verify --print-certs ToucheArt.apk

# Sign APK (using the script)
.\sign-apk.ps1

# Or manually sign
& $apksigner sign --ks android/app/toucheart-release-key.keystore --ks-key-alias toucheart-key --out ToucheArt-signed.apk ToucheArt.apk
```

---

**Your APK `ToucheArt.apk` is ready in the project root!** 🎉


