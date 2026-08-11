package com.example.ui.pages;

import com.microsoft.playwright.Page;

/**
 * 计算器页面对象：封装计算器 Tab 的元素定位与操作。
 */
public class CalculatorPage extends BasePage {

    public CalculatorPage(Page page) {
        super(page);
        clickNav("计算器");
    }

    /** 执行二元运算（加减乘除） */
    public CalculatorPage calculate(int a, int b, String op) {
        page.fill("#calc-a", String.valueOf(a));
        page.selectOption("#calc-op", op);
        page.fill("#calc-b", String.valueOf(b));
        page.click("#calc-run");
        waitForResult("calc-result");
        return this;
    }

    /** 判断质数 */
    public CalculatorPage checkPrime(int n) {
        page.fill("#calc-n", String.valueOf(n));
        page.click("[data-single='isPrime']");
        waitForResult("calc-result");
        return this;
    }

    /** 计算阶乘 */
    public CalculatorPage calculateFactorial(int n) {
        page.fill("#calc-n", String.valueOf(n));
        page.click("[data-single='factorial']");
        waitForResult("calc-result");
        return this;
    }

    /** 获取计算结果文本 */
    public String getResult() {
        return getResultText("calc-result");
    }

    /** 结果是否为成功（绿色） */
    public boolean isResultOk() {
        String cls = page.locator("#calc-result").getAttribute("class");
        return cls != null && cls.contains("ok");
    }
}
