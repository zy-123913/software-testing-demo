package com.example.automation;

import org.junit.platform.suite.api.ExcludePackages;
import org.junit.platform.suite.api.SelectPackages;
import org.junit.platform.suite.api.Suite;

/**
 * 自动化测试套件：扫描 com.example 下所有包，聚合执行全部测试。
 *
 * 注意：默认排除 UI 测试（com.example.ui），因为 Playwright 需要额外安装浏览器。
 *   - 默认运行：mvn test "-Dtest=AutomationTestSuite" "-Dfile.encoding=UTF-8"
 *     （包含单元测试、接口测试、RestAssured 接口测试）
 *   - 包含 UI 测试：mvn test "-Dtest=AutomationTestSuite" "-Dgroups=ui" "-Dfile.encoding=UTF-8"
 *
 * 也可直接通过 IDE 运行此类。
 */
@Suite
@SelectPackages("com.example")
@ExcludePackages("com.example.ui")  // UI 测试需单独启用
public class AutomationTestSuite {
}
