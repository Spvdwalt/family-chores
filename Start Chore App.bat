@echo off
title Family Chores
echo Starting Family Chores at http://localhost:3000 ...
start http://localhost:3000
node "%~dp0server.js"
pause
