package com.example.ui;

import com.example.extension.WebServerExtension;
import com.example.ui.pages.CalculatorPage;
import com.example.ui.pages.TestRunnerPage;
import com.microsoft.playwright.*;
import io.qameta.allure.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.RegisterExtension;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Playwright UI 自动化测试：使用 Page Object Model 模式对 Web 界面进行端到端测试。
 *
 * 运行前提（首次执行需要安装浏览器）：
 *   mvn exec:java -e -Dexec.mainClass=com.microsoft.playwright.CLI -Dexec.args="install chromium"
 *
 * 启用 UI 测试（默认被 surefire 排除）：
 *   mvn test -Dgroups=ui
 */
@Epic("前端界面")
@Feature("Web UI 自动化")
@DisplayName("Playwright UI 自动化测试")
@Tag("ui")
class WebUiTest {

    @RegisterExtension
    static final WebServerExtension server = new WebServerExtension(8089);

    static Playwright playwright;
    static Browser browser;
    BrowserContext context;
    Page page;

    @BeforeAll
    static void launchBrowser() {
        playwright = Playwright.create();
        browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
    }

    @AfterAll
    static void closeBrowser() {
        if (browser != null) browser.close();
        if (playwright != null) playwright.close();
    }

    @BeforeEach
    void createContextAndPage() {
        context = browser.newContext();
        page = context.newPage();
        page.navigate(server.getBaseUrl() + "/");
        page.waitForLoadState();
    }

    @AfterEach
    void closeContext() {
        if (context != null) context.close();
    }

    // ====== 计算器页面测试 ======
    @Test
    @Story("计算器界面")
    @Severity(SeverityLevel.CRITICAL)
    @Description("UI 加法运算：10 + 3 应显示 13")
    @DisplayName("计算器 UI - 加法运算")
    void testCalculatorAdd() {
        CalculatorPage calc = new CalculatorPage(page);
        calc.calculate(10, 3, "add");

        Allure.addAttachment("计算结果", calc.getResult());
        Allure.getLifecycle().addAttachment("截图", "image/png", "png", calc.screenshot());

        assertTrue(calc.isResultOk(), "结果应显示为成功");
        assertTrue(calc.getResult().contains("\"result\": 13"), "加法结果应为 13");
    }

    @Test
    @Story("计算器界面")
    @Severity(SeverityLevel.NORMAL)
    @Description("UI 质数判断：17 应为质数")
    @DisplayName("计算器 UI - 质数判断")
    void testCalculatorPrime() {
        CalculatorPage calc = new CalculatorPage(page);
        calc.checkPrime(17);

        Allure.addAttachment("判断结果", calc.getResult());
        assertTrue(calc.isResultOk());
        assertTrue(calc.getResult().contains("\"result\": true"));
    }

    @Test
    @Story("计算器界面")
    @Severity(SeverityLevel.NORMAL)
    @Description("UI 阶乘：5! 应为 120")
    @DisplayName("计算器 UI - 阶乘运算")
    void testCalculatorFactorial() {
        CalculatorPage calc = new CalculatorPage(page);
        calc.calculateFactorial(5);

        Allure.addAttachment("阶乘结果", calc.getResult());
        assertTrue(calc.isResultOk());
        assertTrue(calc.getResult().contains("\"result\": 120"));
    }

    // ====== 测试运行页面测试 ======
    @Test
    @Story("测试执行界面")
    @Severity(SeverityLevel.CRITICAL)
    @Description("运行计算器单元测试，应全部通过")
    @DisplayName("测试运行 UI - 执行计算器测试套件")
    void testRunCalculatorSuite() {
        TestRunnerPage runner = new TestRunnerPage(page);
        runner.runTests("calculator");

        Allure.addAttachment("执行日志", runner.getLogText());
        Allure.getLifecycle().addAttachment("截图", "image/png", "png", runner.screenshot());

        assertTrue(runner.isAllPassed(), "计算器测试应全部通过");
        assertEquals(0, runner.getFailureCount(), "不应有失败用例");
    }

    @Test
    @Story("测试执行界面")
    @Severity(SeverityLevel.CRITICAL)
    @Description("运行全部测试，应全部通过")
    @DisplayName("测试运行 UI - 执行全部测试")
    void testRunAllTests() {
        TestRunnerPage runner = new TestRunnerPage(page);
        runner.runTests("all");

        Allure.addAttachment("执行日志", runner.getLogText());
        Allure.getLifecycle().addAttachment("截图", "image/png", "png", runner.screenshot());

        assertTrue(runner.isAllPassed(), "所有测试应全部通过");
    }

    // ====== 页面导航测试 ======
    @Test
    @Story("页面导航")
    @Severity(SeverityLevel.MINOR)
    @Description("切换到各个 Tab，对应面板应显示")
    @DisplayName("页面导航 - Tab 切换")
    void testTabNavigation() {
        // 默认在计算器 Tab
        assertTrue(page.locator("#panel-calc").isVisible(), "计算器面板应可见");

        // 切换到字符串工具
        page.locator(".nav-btn", new Page.LocatorOptions().setHasText("字符串工具")).click();
        assertTrue(page.locator("#panel-str").isVisible(), "字符串面板应可见");

        // 切换到用户校验
        page.locator(".nav-btn", new Page.LocatorOptions().setHasText("用户校验")).click();
        assertTrue(page.locator("#panel-user").isVisible(), "用户校验面板应可见");

        // 切换到运行测试
        page.locator(".nav-btn", new Page.LocatorOptions().setHasText("运行测试")).click();
        assertTrue(page.locator("#panel-test").isVisible(), "测试面板应可见");

        Allure.getLifecycle().addAttachment("截图", "image/png", "png", runnerScreenshot());
    }

    private byte[] runnerScreenshot() {
        return page.screenshot();
    }
}
