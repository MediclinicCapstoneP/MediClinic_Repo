@echo off
echo ===================================
echo  IgabayCare Flutter Fix Script
echo ===================================

echo.
echo Step 1: Checking if Flutter is installed...
where flutter >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Flutter is not installed or not in PATH
    echo    Please install Flutter SDK from https://flutter.dev/docs/get-started/install
    echo    Then add Flutter to your PATH environment variable
    goto :error_exit
) else (
    echo ✅ Flutter is installed
    flutter --version
)

echo.
echo Step 2: Cleaning Flutter build cache...
flutter clean

echo.
echo Step 3: Removing pubspec.lock to force fresh dependency resolution...
if exist pubspec.lock del pubspec.lock

echo.
echo Step 4: Repairing package cache...
flutter pub cache repair

echo.
echo Step 5: Getting Flutter dependencies...
flutter pub get

echo.
echo Step 6: Running basic analysis...
flutter analyze --no-fatal-infos

echo.
echo ===================================
echo  Fix script completed!
echo ===================================
echo.
echo If you're still seeing import errors in your IDE:
echo 1. Restart your IDE completely
echo 2. Close and reopen the project
echo 3. Run 'Flutter: Reload' in VS Code (Ctrl+Shift+P)
echo 4. Clear IDE cache if available
echo.
echo Try running the app with: flutter run
echo.
pause
exit /b 0

:error_exit
echo.
echo ❌ Critical error detected. Please fix the above issues first.
echo.
pause
exit /b 1