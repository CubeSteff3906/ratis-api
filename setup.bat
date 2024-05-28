@echo off
set taskName=LambdaAPIBootup
set scriptPath=".\startup.bat"
set setupUrl=http://localhost:3000/util/setup

REM Run the startup script to start the server
start "" %scriptPath%

REM Wait for the server to start (optional, adjust the timeout as needed)
timeout /t 15 /nobreak

REM Fetch the setup route using PowerShell
powershell -Command "Invoke-WebRequest -Uri '%setupUrl%'"

REM Check if the request was successful
if %errorlevel% equ 0 (
    echo Setup URL fetched successfully.
) else (
    echo Failed to fetch setup URL.
    exit /b %errorlevel%
)

REM Add the startup script to Task Scheduler
schtasks /create /tn %taskName% /tr %scriptPath% /sc onlogon /rl highest /f

REM Verify if the task was created successfully
if %errorlevel% equ 0 (
    echo Task successfully created.
) else (
    echo Failed to create the task.
    exit /b %errorlevel%
)

echo Setup completed.