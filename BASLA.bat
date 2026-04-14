@echo off
echo ==========================================
echo  PROJE GORUNTULEYICI - BASLATICI
echo ==========================================
echo.

REM Node.js kontrolu
where node >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Node.js bulundu.
    echo [*] Lokal sunucu baslatiliyor...
    echo.
    echo Admin Panel: http://localhost:8080/admin.html
    echo.
    start http://localhost:8080/admin.html
    npx serve -p 8080 .
) else (
    echo [!] Node.js bulunamadi.
    echo.
    echo Node.js indirin: https://nodejs.org
    echo (LTS surum onerilen)
    echo.
    echo Alternatif: admin.html dosyasini cift tiklayarak acin.
    echo (Firebase ozellikleri icin lokal sunucu gereklidir)
    echo.
    start admin.html
    pause
)
