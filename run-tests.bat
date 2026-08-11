@echo off
chcp 65001 >nul
echo ============================================
echo   软件测试演示平台 - 一键运行全部测试
echo   (单元 + Service + API 集成，默认排除 Playwright UI)
echo ============================================
echo.
where mvn >nul 2>nul
if errorlevel 1 (
    echo [错误] 未检测到 Maven，请先安装并配置 PATH
    pause
    exit /b 1
)
cd /d "%~dp0"
echo 正在执行 mvn clean test ...
echo.
mvn clean test
set RC=%ERRORLEVEL%
echo.
echo ============================================
if %RC%==0 (
    echo [成功] 全部测试通过！
    echo   - JaCoCo 覆盖率报告: target\site\jacoco\index.html
    echo   - Allure 原始结果:    target\allure-results
    echo   如需生成 Allure HTML 报告，执行: mvn allure:report
) else (
    echo [失败] 存在失败用例，退出码 %RC%
)
echo ============================================
pause
exit /b %RC%
