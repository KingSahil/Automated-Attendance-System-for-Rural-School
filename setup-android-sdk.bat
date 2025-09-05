@echo off
echo Setting up Android SDK for Rural Attendance App...
echo.

REM Create Android SDK directory
set ANDROID_HOME=%USERPROFILE%\android-sdk
set ANDROID_SDK_ROOT=%ANDROID_HOME%
echo Creating Android SDK directory: %ANDROID_HOME%
if not exist "%ANDROID_HOME%" mkdir "%ANDROID_HOME%"

REM Download command line tools
echo Downloading Android SDK Command Line Tools...
set CMDTOOLS_URL=https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip
set CMDTOOLS_ZIP=%TEMP%\commandlinetools.zip

REM Use PowerShell to download (more reliable than curl on Windows)
powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest '%CMDTOOLS_URL%' -OutFile '%CMDTOOLS_ZIP%' }"

if not exist "%CMDTOOLS_ZIP%" (
    echo Error: Failed to download command line tools
    pause
    exit /b 1
)

REM Extract command line tools
echo Extracting command line tools...
powershell -Command "Expand-Archive -Path '%CMDTOOLS_ZIP%' -DestinationPath '%ANDROID_HOME%' -Force"

REM Move cmdline-tools to correct location
if not exist "%ANDROID_HOME%\cmdline-tools" mkdir "%ANDROID_HOME%\cmdline-tools"
move "%ANDROID_HOME%\cmdline-tools" "%ANDROID_HOME%\cmdline-tools\temp" 2>nul
mkdir "%ANDROID_HOME%\cmdline-tools\latest"
move "%ANDROID_HOME%\cmdline-tools\temp\*" "%ANDROID_HOME%\cmdline-tools\latest\" 2>nul
rmdir "%ANDROID_HOME%\cmdline-tools\temp" 2>nul

REM Set up PATH
set PATH=%ANDROID_HOME%\cmdline-tools\latest\bin;%ANDROID_HOME%\platform-tools;%PATH%

REM Accept licenses
echo Accepting Android SDK licenses...
echo y | "%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat" --licenses

REM Install required SDK components
echo Installing required SDK components...
"%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat" "platform-tools"
"%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat" "platforms;android-34"
"%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat" "build-tools;34.0.0"

REM Create local.properties file
echo Creating local.properties file...
echo sdk.dir=%ANDROID_HOME:\=/% > "%CD%\android\local.properties"

REM Set environment variables permanently
echo Setting environment variables...
setx ANDROID_HOME "%ANDROID_HOME%"
setx ANDROID_SDK_ROOT "%ANDROID_HOME%"

echo.
echo ✓ Android SDK setup completed!
echo ✓ ANDROID_HOME: %ANDROID_HOME%
echo ✓ local.properties created
echo.
echo You can now build the APK by running:
echo   gradlew.bat assembleDebug
echo.
pause