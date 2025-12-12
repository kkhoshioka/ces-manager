@echo off
start "Backend" "C:\Program Files\nodejs\node.exe" "node_modules\tsx\dist\cli.mjs" "server\index.ts"
start "Frontend" "C:\Program Files\nodejs\node.exe" "node_modules\vite\bin\vite.js" --host
pause
