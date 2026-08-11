@echo off
chcp 65001 >nul
echo ============================================
echo   软件测试演示平台 - 一键打包 Fat JAR
echo   (含所有依赖 + 内嵌前端，可直接 java -jar 运行)
echo ============================================
echo.
where mvn >nul 2>nul
if errorlevel 1 (
    echo [错误] 未检测到 Maven，请先安装并配置 PATH
    pause
    exit /b 1
)
cd /d "%~dp0"
echo 正在执行 mvn clean package -DskipTests ...
echo.
mvn clean package -DskipTests
set RC=%ERRORLEVEL%
echo.
echo ============================================
if %RC%==0 (
    echo [成功] 打包完成！
    for %%f in (target\software-testing-demo-*-shaded.jar target\software-testing-demo-*.jar) do (
        if exist "%%f" echo   JAR 路径: %%~ff
    )
    echo.
    echo 运行方式：
    echo   java -jar target\software-testing-demo-1.0-SNAPSHOT.jar
    echo   自定义端口：java -Dserver.port=9000 -jar xxx.jar
) else (
    echo [失败] 打包出错，退出码 %RC%
)
echo ============================================
pause
exit /b %RC%
