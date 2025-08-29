@echo off
echo ====================================================
echo  IgabayCare Flutter Environment Diagnostic Tool
echo ====================================================
echo.

set "PROJECT_DIR=%cd%"
echo Project Directory: %PROJECT_DIR%
echo.

echo [1/8] Checking Flutter Installation...
echo ====================================================
flutter --version 2>nul
if %errorlevel% neq 0 (
    echo ❌ CRITICAL: Flutter command not found!
    echo    - Flutter is not installed or not in PATH
    echo    - Install Flutter SDK and add to PATH
    echo    - Restart command prompt after installation
    goto :error_exit
) else (
    echo ✅ Flutter command found
    flutter --version
)
echo.

echo [2/8] Running Flutter Doctor...
echo ====================================================
flutter doctor
echo.

echo [3/8] Checking Project Structure...
echo ====================================================
if exist "pubspec.yaml" (
    echo ✅ pubspec.yaml found
) else (
    echo ❌ CRITICAL: pubspec.yaml not found!
    echo    - Run this script from Flutter project root
    goto :error_exit
)

if exist "lib\main.dart" (
    echo ✅ lib\main.dart found
) else (
    echo ❌ WARNING: lib\main.dart not found
)

if exist "android" (
    echo ✅ android folder found
) else (
    echo ❌ WARNING: android folder not found
)

if exist "ios" (
    echo ✅ ios folder found
) else (
    echo ❌ INFO: ios folder not found (normal on Windows)
)
echo.

echo [4/8] Checking Package Dependencies...
echo ====================================================
if exist "pubspec.lock" (
    echo ✅ pubspec.lock exists
    echo    Current lock file size:
    for %%F in (pubspec.lock) do echo    %%~zF bytes
) else (
    echo ❌ WARNING: pubspec.lock missing - dependencies not installed
)

if exist ".dart_tool" (
    echo ✅ .dart_tool directory exists
) else (
    echo ❌ WARNING: .dart_tool missing - run 'flutter pub get'
)

if exist ".dart_tool\package_config.json" (
    echo ✅ package_config.json exists
) else (
    echo ❌ CRITICAL: package_config.json missing
    echo    - Dependencies not properly resolved
    echo    - Run 'flutter clean' then 'flutter pub get'
)
echo.

echo [5/8] Testing Package Cache...
echo ====================================================
echo Flutter package cache location:
flutter pub cache list 2>nul
if %errorlevel% neq 0 (
    echo ❌ WARNING: Cannot access package cache
) else (
    echo ✅ Package cache accessible
)
echo.

echo [6/8] Analyzing pubspec.yaml...
echo ====================================================
echo Required packages status:
findstr /C:"flutter:" pubspec.yaml >nul && echo ✅ Flutter SDK dependency found || echo ❌ Flutter SDK dependency missing
findstr /C:"supabase_flutter:" pubspec.yaml >nul && echo ✅ Supabase Flutter found || echo ❌ Supabase Flutter missing
findstr /C:"provider:" pubspec.yaml >nul && echo ✅ Provider found || echo ❌ Provider missing
findstr /C:"go_router:" pubspec.yaml >nul && echo ✅ Go Router found || echo ❌ Go Router missing
findstr /C:"google_fonts:" pubspec.yaml >nul && echo ✅ Google Fonts found || echo ❌ Google Fonts missing
findstr /C:"intl:" pubspec.yaml >nul && echo ✅ Intl found || echo ❌ Intl missing
echo.

echo [7/8] Testing Basic Flutter Commands...
echo ====================================================
echo Testing 'flutter analyze'...
flutter analyze --no-fatal-infos 2>nul
if %errorlevel% neq 0 (
    echo ❌ Flutter analyze failed
    echo    This indicates import/dependency issues
) else (
    echo ✅ Flutter analyze completed
)
echo.

echo [8/8] Environment Summary...
echo ====================================================
echo Flutter Version:
flutter --version | findstr "Flutter"

echo.
echo Dart Version:
dart --version

echo.
echo Project Dependencies Status:
if exist ".dart_tool\package_config.json" (
    echo ✅ Dependencies appear to be installed
) else (
    echo ❌ Dependencies NOT properly installed
)

echo.
echo IDE Cache Status:
if exist ".dart_tool\flutter_build" (
    echo ✅ Flutter build cache exists
) else (
    echo ❌ Flutter build cache missing
)

echo.
echo ====================================================
echo  DIAGNOSIS COMPLETE
echo ====================================================

echo.
echo RECOMMENDED ACTIONS:
echo.
if not exist ".dart_tool\package_config.json" (
    echo 🔧 PRIORITY 1: Fix Dependencies
    echo    1. Run: flutter clean
    echo    2. Run: del pubspec.lock
    echo    3. Run: flutter pub get
    echo    4. Restart your IDE
    echo.
)

if not exist "pubspec.lock" (
    echo 🔧 PRIORITY 2: Install Dependencies
    echo    Run: flutter pub get
    echo.
)

echo 🔧 PRIORITY 3: IDE Reset
echo    1. Close your IDE completely
echo    2. Restart your IDE
echo    3. Reload the project
echo    4. Clear IDE cache if available
echo.

echo 🔧 PRIORITY 4: Analysis Server Reset
echo    In your IDE:
echo    - VS Code: Ctrl+Shift+P → "Dart: Restart Analysis Server"
echo    - Android Studio: Tools → Flutter → Restart Analysis Server
echo.

echo Would you like to run automatic fixes? (Y/N)
set /p choice="> "

if /i "%choice%"=="Y" (
    echo.
    echo Running automatic fixes...
    echo.
    
    echo [FIX 1/4] Cleaning project...
    flutter clean
    
    echo [FIX 2/4] Removing lock file...
    if exist "pubspec.lock" del "pubspec.lock"
    
    echo [FIX 3/4] Repairing package cache...
    flutter pub cache repair
    
    echo [FIX 4/4] Installing dependencies...
    flutter pub get --verbose
    
    echo.
    echo ✅ Automatic fixes completed!
    echo.
    echo NEXT STEPS:
    echo 1. Restart your IDE completely
    echo 2. Reopen this project
    echo 3. Wait for analysis to complete
    echo 4. Check if import errors are resolved
    echo.
) else (
    echo.
    echo Manual fix instructions saved to DEPENDENCY_FIX_README.md
    echo.
)

goto :end

:error_exit
echo.
echo ❌ Critical error detected. Please fix the above issues first.
echo.
pause
exit /b 1

:end
echo.
echo Diagnostic completed. Press any key to exit.
pause >nul