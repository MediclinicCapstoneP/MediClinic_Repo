@echo off
echo ===================================
echo  IgabayCare Flutter Dependencies Fix
echo ===================================

echo.
echo Step 1: Checking Flutter installation...
flutter doctor

echo.
echo Step 2: Cleaning Flutter build cache...
flutter clean

echo.
echo Step 3: Removing pubspec.lock to force fresh dependency resolution...
if exist pubspec.lock del pubspec.lock

echo.
echo Step 4: Getting Flutter dependencies...
flutter pub get

echo.
echo Step 5: Running pub deps to verify dependency tree...
flutter pub deps

echo.
echo Step 6: Running basic analysis to check for errors...
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
pause