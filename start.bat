@echo off
chcp 65001 >nul
echo ============================================
echo   软件测试演示平台 - 一键启动
echo ============================================
echo.
echo [提示] 默认端口 8099，可通过 set PORT=xxxx 自定义
echo.
where mvn >nul 2>nul
if errorlevel 1 (
    echo [错误] 未检测到 Maven，请先安装并配置 PATH
    pause
    exit /b 1
)
cd /d "%~dp0"
echo 正在编译并启动 Web 应用...
echo.
mvn "-Dexec.mainClass=com.example.web.WebApplication" exec:java
if errorlevel 1 (
    echo.
    echo [启动失败] 请检查上方日志
    pause
)
