@echo off
echo Starting Rural Attendance Scanner Local Server...
echo.
echo This will start a simple HTTP server for testing the app.
echo The server will be available at: http://localhost:8000
echo.
echo Make sure you have Python installed on your system.
echo.
echo Press Ctrl+C to stop the server when done.
echo.

REM Check if Python 3 is available
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Using Python 3...
    python -m http.server 8000
) else (
    REM Check if Python 2 is available
    python2 --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo Using Python 2...
        python2 -m SimpleHTTPServer 8000
    ) else (
        echo.
        echo ERROR: Python is not installed or not in PATH.
        echo.
        echo Please install Python from https://python.org
        echo Or use any other HTTP server to serve these files.
        echo.
        echo Alternative methods:
        echo 1. Use Node.js: npx http-server
        echo 2. Use VS Code Live Server extension
        echo 3. Use any web server (Apache, Nginx, etc.)
        echo.
        pause
    )
)