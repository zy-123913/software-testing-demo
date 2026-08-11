# 软件测试演示平台 🧪

> 基于 JUnit 5 的全栈软件测试演示项目，涵盖 **单元测试 + API 自动化测试 + UI 自动化测试 + 性能测试 + 测试报告**，并提供前后端一体化的可视化 Web 界面。

## ✨ 项目特点

- **测试类型全覆盖**：单元测试、API 接口测试、UI 自动化测试、性能测试四位一体
- **企业级技术栈**：JUnit 5 + RestAssured + Playwright + Allure + JMeter
- **Page Object 模型**：UI 自动化采用 PO 设计模式，分层清晰
- **可视化测试执行**：浏览器中一键运行测试，实时展示通过/失败统计与详细日志
- **Allure 测试报告**：自动生成可视化测试报告，含截图、步骤、严重等级
- **70+ 测试用例**：覆盖正常流程、边界值、异常场景

## 🛠️ 技术栈

| 类别 | 技术 | 说明 |
|---|---|---|
| 单元测试 | JUnit 5 | 参数化测试、异常测试、生命周期回调 |
| API 自动化 | RestAssured | 链式断言、BDD 风格 |
| UI 自动化 | Playwright | Page Object Model、自动截图 |
| 性能测试 | JMeter | 并发压测、HTML 报告 |
| 测试报告 | Allure | 可视化报告、附件、标签 |
| 后端 | Java 8 + JDK HttpServer | 零容器依赖 |
| 前端 | HTML/CSS/JS | 原生实现，无框架 |
| 构建 | Maven | |
| 部署 | Docker + Gitee Pages | |

## 📂 项目结构

```
src/
├── main/java/com/example/
│   ├── utils/                      业务工具类
│   │   ├── Calculator.java
│   │   ├── StringUtils.java
│   │   └── UserValidator.java
│   ├── api/UserApi.java            HTTP 接口服务
│   └── web/WebApplication.java     Web 应用主入口
├── main/resources/static/          前端页面
└── test/java/com/example/
    ├── utils/                      单元测试
    │   ├── CalculatorTest.java
    │   ├── StringUtilsTest.java
    │   └── UserValidatorTest.java
    ├── api/
    │   ├── UserApiTest.java        接口测试（原生 HTTP）
    │   └── UserApiRestAssuredTest.java  ★ RestAssured + Allure
    ├── ui/                         ★ UI 自动化测试
    │   ├── pages/
    │   │   ├── BasePage.java
    │   │   ├── CalculatorPage.java
    │   │   └── TestRunnerPage.java
    │   └── WebUiTest.java
    ├── extension/
    │   └── WebServerExtension.java JUnit 5 扩展
    └── automation/
        └── AutomationTestSuite.java 自动化测试套件
jmeter/                             ★ 性能测试
├── SoftwareTestingDemo.jmx
├── run.bat
└── README.md
docs/                               纯静态 Demo（Gitee Pages 部署）
```

## 🚀 快速开始

### 环境要求
- JDK 8+
- Maven 3.6+
- （可选）JMeter 5.6+ 用于性能测试
- （可选）Playwright 浏览器用于 UI 测试

### 启动应用

```bash
mvn compile test-compile
mvn exec:java "-Dfile.encoding=UTF-8"
```

访问 http://localhost:8080/

## 🧪 运行测试

### 1. 单元测试 + 接口测试（默认）

```bash
mvn clean test "-Dfile.encoding=UTF-8"
```

### 2. RestAssured + Allure 接口测试

```bash
mvn test "-Dtest=UserApiRestAssuredTest" "-Dfile.encoding=UTF-8"
```

### 3. 生成 Allure 测试报告

```bash
mvn test "-Dfile.encoding=UTF-8"
mvn allure:report
# 报告生成在 target/site/allure-maven-plugin/index.html
```

### 4. UI 自动化测试（需先安装浏览器）

```bash
# 首次运行：安装 Chromium 浏览器
mvn exec:java -e -Dexec.mainClass=com.microsoft.playwright.CLI -Dexec.args="install chromium"

# 运行 UI 测试
mvn test "-Dgroups=ui" "-Dfile.encoding=UTF-8"
```

### 5. 性能测试（需先安装 JMeter）

```bash
# 设置 JMETER_HOME 环境变量后，双击 jmeter/run.bat
# 或命令行运行：
%JMETER_HOME%\bin\jmeter -n -t jmeter/SoftwareTestingDemo.jmx -l result.jtl -e -o report
```

## 📊 测试用例统计

| 测试类 | 类型 | 用例数 | 说明 |
|---|---|---|---|
| CalculatorTest | 单元测试 | 12 | 含参数化测试、异常测试 |
| StringUtilsTest | 单元测试 | 10 | 含参数化测试 |
| UserValidatorTest | 单元测试 | 10 | 含参数化测试 |
| UserApiTest | 接口测试 | 7 | 原生 HTTP 客户端 |
| UserApiRestAssuredTest | API 自动化 | 9 | RestAssured + Allure |
| WebUiTest | UI 自动化 | 6 | Playwright + PO 模型 |
| **合计** | | **54+** | |

## 🎯 测试方法说明

| 测试方法 | 示例 |
|---|---|
| 基本断言 | `assertEquals`, `assertTrue`, `assertThrows` |
| 参数化测试 | `@ParameterizedTest` + `@CsvSource` / `@ValueSource` |
| 异常测试 | `assertThrows` 验证异常类型和消息 |
| 生命周期回调 | `@BeforeEach`, `@AfterEach`, `@BeforeAll`, `@AfterAll` |
| 测试套件 | `@Suite` + `@SelectPackages` |
| JUnit 5 扩展 | `@RegisterExtension` 自定义扩展 |
| BDD 风格 API 测试 | `given().when().then()` 链式断言 |
| Allure 注解 | `@Epic`, `@Feature`, `@Story`, `@Severity`, `@Step` |
| Page Object Model | 页面对象封装，分离定位器与测试逻辑 |
| 性能压测 | JMeter 线程组、断言、聚合报告 |

## 🌐 在线 Demo

- Gitee 仓库：https://gitee.com/你的用户名/software-testing-demo
- 在线体验：https://你的用户名.gitee.io/software-testing-demo
