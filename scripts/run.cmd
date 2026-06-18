@echo off
setlocal
node "%~dp0run.mjs" %*
exit /b %ERRORLEVEL%