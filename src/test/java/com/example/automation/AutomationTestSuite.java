package com.example.automation;

import org.junit.platform.suite.api.SelectPackages;
import org.junit.platform.suite.api.Suite;

/**
 * 自动化测试套件：扫描 com.example 下所有包，聚合执行全部单元测试与接口测试。
 *
 * 运行方式：
 *   mvn test "-Dtest=AutomationTestSuite" "-Dfile.encoding=UTF-8"
 *
 * 也可直接通过 IDE 运行此类，JUnit Platform 会自动发现并执行被选中的测试类。
 */
@Suite
@SelectPackages("com.example")
public class AutomationTestSuite {
}
