@echo off

echo.
echo.

echo Lambda Grid booting up...
echo.

timeout /t 2 /nobreak > nul

echo Lambda Grid initiated!
echo Booting up database services...
echo.

powershell -Command "Start-Process cmd -ArgumentList '/c cd /d %SystemRoot%\System32 && mongod --ipv6' -WindowStyle Hidden"
timeout /t 5 /nobreak > nul

echo Database services online!
echo Booting up the central mainframe...
echo.

call npm run devStart

pause