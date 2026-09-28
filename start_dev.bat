@echo off
chcp 65001 > nul
title تشغيل منصة لِـثْ (LITH Platform)

echo ========================================================
echo       منصة لِـثْ (LITH) — ترجمة المحاضرات المتزامنة
echo ========================================================
echo.

echo [1/2] جاري تشغيل خادم الباك إند (Flask API)...
start "Lith Backend API (Port 5000)" cmd /k "cd /d %~dp0backend && venv\Scripts\python.exe run.py"

echo [2/2] جاري تشغيل واجهة المستخدم (React Vite)...
start "Lith Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

echo.
echo ========================================================
echo تم إطلاق السيرفر والواجهة بنجاح!
echo افتح المتصفح على: http://localhost:5173
echo ========================================================
pause
