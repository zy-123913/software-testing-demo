package com.example.ui.pages;

import com.microsoft.playwright.Page;

/**
 * 测试执行页面对象：封装"运行测试" Tab 的操作。
 */
public class TestRunnerPage extends BasePage {

    public TestRunnerPage(Page page) {
        super(page);
        clickNav("运行测试");
    }

    /** 点击运行测试按钮，等待执行完成 */
    public TestRunnerPage runTests(String target) {
        page.click("[data-target='" + target + "']");
        // 等待按钮重新可用（执行完成）
        page.waitForCondition(() ->
                !page.locator("[data-target='" + target + "']").isDisabled(),
                new Page.WaitForConditionOptions().setTimeout(30000));
        return this;
    }

    /** 获取总用例数 */
    public String getTotalCount() {
        return page.locator(".test-summary .stat").first().textContent().trim();
    }

    /** 是否所有测试通过（摘要区显示绿色） */
    public boolean isAllPassed() {
        String cls = page.locator("#test-summary").getAttribute("class");
        return cls != null && cls.contains("ok");
    }

    /** 获取失败详情卡片数量 */
    public int getFailureCount() {
        return page.locator(".failure-card").count();
    }

    /** 获取日志区文本 */
    public String getLogText() {
        return page.locator("#test-log").textContent();
    }
}
