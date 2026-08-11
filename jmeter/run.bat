@echo off
chcp 65001 >nul
REM ============================================
REM  JMeter 性能测试启动脚本
REM  使用前请先启动被测服务: mvn exec:java
REM  并设置 JMETER_HOME 环境变量指向 JMeter 安装目录
REM ============================================

setlocal

REM 检查 JMETER_HOME
if "%JMETER_HOME%"=="" (
    echo [错误] 未设置 JMETER_HOME 环境变量
    echo 请先安装 JMeter 并设置环境变量，例如:
    echo     set JMETER_HOME=D:\apache-jmeter-5.6.3
    echo 或直接修改本脚本中的 JMETER_HOME 变量
    pause
    exit /b 1
)

set JMETER_BIN=%JMETER_HOME%\bin\jmeter.bat
set TEST_PLAN=%~dp0SoftwareTestingDemo.jmx
set RESULT_DIR=%~dp0results
set RESULT_JTL=%RESULT_DIR%\result_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%.jtl
set RESULT_JTL=%RESULT_JTL: =0%
set HTML_DIR=%RESULT_DIR%\html_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set HTML_DIR=%HTML_DIR: =0%

if not exist "%RESULT_DIR%" mkdir "%RESULT_DIR%"

echo ============================================
echo   软件测试演示平台 - JMeter 性能测试
echo ============================================
echo   测试计划: %TEST_PLAN%
echo   结果文件: %RESULT_JTL%
echo   HTML报告: %HTML_DIR%
echo ============================================
echo.

REM 非图形化模式运行，生成 JTL 结果 + HTML 报告
call "%JMETER_BIN%" -n -t "%TEST_PLAN%" -l "%RESULT_JTL%" -e -o "%HTML_DIR%"

echo.
echo ============================================
echo   测试完成！
echo   JTL 结果: %RESULT_JTL%
echo   HTML 报告: %HTML_DIR%\index.html
echo ============================================
pause
