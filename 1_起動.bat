@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ===================================================
echo   溶融亜鉛めっき 技術伝承AIバイブル を起動しています...
echo   URL: http://localhost:3000
echo ===================================================

start "" "http://localhost:3000"
call npm run dev

pause
