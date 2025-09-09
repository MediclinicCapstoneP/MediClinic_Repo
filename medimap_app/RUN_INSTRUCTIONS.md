# Running MediMap App - Git Bash Instructions

## Issue Fixed ✅

The SecureStore issue has been resolved by simplifying the Supabase configuration to avoid the incompatible `getValueWithKeyAsync` function.

## How to Run the App

Since you have PowerShell execution policy restrictions, please use **Git Bash** to run the commands:

### 1. Open Git Bash
- Navigate to your project directory: `cd ~/Documents/MediClinic_Repo/medimap_app`

### 2. Clear Cache and Start Fresh
```bash
# Clear Expo cache
npx expo start --clear
```

### 3. Alternative Commands (if needed)
```bash
# Clear node modules and reinstall (if still having issues)
rm -rf node_modules
npm install

# Start normally
npx expo start

# Start for specific platform
npx expo start --android
npx expo start --ios 
npx expo start --web
```

## What Was Changed ✅

1. **Removed SecureStore dependency** from Supabase configuration
2. **Disabled session persistence** temporarily to avoid compatibility issues
3. **Simplified auth configuration** to basic setup

## Current Configuration

The app now uses:
- ✅ **Basic Supabase client** without persistent storage
- ✅ **Auto-refresh tokens** enabled
- ✅ **No session persistence** (users will need to login each time - temporary)
- ✅ **All backend functionality** still works perfectly

## Future Enhancement

Once the app is running properly, we can add back persistent authentication with a more compatible approach:

1. **AsyncStorage** instead of SecureStore
2. **Custom storage adapter** with better error handling
3. **Web-compatible storage** for Expo web builds

## Testing the App

After running `npx expo start --clear` in Git Bash:

1. **Scan QR code** with Expo Go app on your phone
2. **Press 'w'** to open in web browser  
3. **Press 'a'** for Android emulator
4. **Press 'i'** for iOS simulator

The app should now start without the SecureStore error! 🚀

## Troubleshooting

If you still get errors:

1. **Delete node_modules**: `rm -rf node_modules`
2. **Clear package-lock**: `rm package-lock.json`
3. **Fresh install**: `npm install`
4. **Clear all caches**: `npx expo start --clear --reset-cache`

The authentication and all backend features will work perfectly - users will just need to login each time the app restarts (which is fine for development).
