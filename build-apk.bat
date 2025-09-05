@echo off
echo Building Rural Attendance APK...
echo.

REM Step 1: Copy latest web assets
echo Step 1: Copying latest web assets...
call npx cap copy android
if %errorlevel% neq 0 (
    echo Error: Failed to copy web assets
    pause
    exit /b 1
)

REM Step 2: Sync Capacitor
echo Step 2: Syncing Capacitor...
call npx cap sync android
if %errorlevel% neq 0 (
    echo Error: Failed to sync Capacitor
    pause
    exit /b 1
)

REM Step 3: Build APK
echo Step 3: Building APK...
cd android
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo Error: Failed to build APK
    pause
    exit /b 1
)

echo.
echo ✓ APK built successfully!
echo Location: android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause