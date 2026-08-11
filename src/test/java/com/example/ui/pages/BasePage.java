package com.example.ui.pages;

import com.microsoft.playwright.Page;
import com.microsoft.playwright.Locator;

/**
 * 页面对象基类：封装 Playwright Page 的通用操作。
 * 所有 Page Object 都应继承此类。
 */
public abstract class BasePage {
    protected final Page page;

    public BasePage(Page page) {
        this.page = page;
    }

    /** 点击导航栏按钮切换 Tab */
    public void clickNav(String tabName) {
        page.locator(".nav-btn", new Page.LocatorOptions().setHasText(tabName)).click();
    }

    /** 获取结果区域的文本内容 */
    public String getResultText(String resultId) {
        return page.locator("#" + resultId).textContent();
    }

    /** 等待结果区域出现内容（非空） */
    public void waitForResult(String resultId) {
        page.waitForCondition(() -> {
            String t = page.locator("#" + resultId).textContent();
            return t != null && !t.trim().isEmpty();
        }, new Page.WaitForConditionOptions().setTimeout(5000));
    }

    /** 截图（保存到 Allure 附件） */
    public byte[] screenshot() {
        return page.screenshot();
    }
}
