# 软件测试演示平台 🧪

> 企业级全栈软件测试项目（求职简历版），涵盖 **电商业务三层架构 + 单元测试 + API 自动化 + UI 自动化 + 性能测试 + 可视化界面**，前后端一体化，支持 GitHub Pages 在线演示。

---

## 🏢 项目定位

本项目模拟了一个**电商订单系统**的完整研发与测试流程，基于经典 **Entity / DAO / Service 三层架构**，实现了用户、商品、订单三大核心业务模块。项目交付了完整的测试体系：从 Service 层 Mockito 单元测试，到 RestAssured + Allure API 集成测试，再到 Playwright（POM）UI 自动化测试，以及 JMeter 多线程并发压测。所有测试能力均可通过 Web 界面**可视化一键执行**，实时展示通过/失败统计、断言详情和性能指标。

---

## ✨ 核心亮点

- **💼 电商业务三层架构**：Entity / DAO / Service 分层，用户/商品/订单全生命周期
- **🎯 四大测试类型全覆盖**：单元测试、API 自动化、UI 自动化、性能压测
- **🏭 企业级技术栈**：JUnit 5 + Mockito + RestAssured + Allure + Playwright (POM) + JMeter
- **🧪 85+ 测试用例**：正常流、边界值、参数化、异常场景、权限校验、库存扣减
- **📊 Web 可视化测试执行**：9 Tab 控制台，一键运行 + 实时结果展示（统计卡片/失败详情/彩色日志）
- **📈 性能压测仪表盘**：模拟 JMeter 并发，实时输出 TPS / 平均响应 / P90 / P95 / 错误率
- **🌐 双模式部署**：① Java 后端启动（真实业务 API）② 纯静态 GitHub Pages（前端离线 Mock）
- **📝 Allure 报告**：BDD 风格、Epic/Feature/Story 分级、严重等级标注

---

## 🛠️ 技术架构

### 业务架构（三层）
```
┌──────────────────────────────────────────────────────────┐
│                     Web 可视化层 (9 Tab)                  │
│  计算器 | 字符串 | 用户校验 | 用户/商品/订单管理 | 接口测试 |
│               运行测试 | 性能测试                          │
└──────────────────────────────┬───────────────────────────┘
                               │ HTTP / JSON
┌──────────────────────────────▼───────────────────────────┐
│                   REST API Handler 层                     │
│  /biz/user/*  /biz/product/*  /biz/order/*  /biz/init    │
└──────────────────────────────┬───────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────┐
│                   Service 业务层 (含校验/事务/规则)        │
│   UserService · ProductService · OrderService             │
│   (Mockito 单元测试 · 参数化 · 异常场景 · 边界断言)         │
└──────────────────────────────┬───────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────┐
│                   DAO 数据访问层 (接口 + 内存实现)         │
│   UserDao / ProductDao / OrderDao + InMemory*Impl         │
└──────────────────────────────┬───────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────┐
│                   Entity 实体层 (POJO + Builder)          │
│   User · Product · Order · BusinessException              │
└──────────────────────────────────────────────────────────┘
```

### 技术栈明细

| 分层 | 技术 | 说明 |
|---|---|---|
| **语言/构建** | Java 8 + Maven | 统一依赖管理、插件化 |
| **Web 服务** | JDK HttpServer + Gson | 零容器、零 Spring 依赖 |
| **实体/异常** | POJO + BusinessException | 统一错误码、业务异常处理 |
| **DAO 层** | 接口 + 内存实现 (InMemory) | 可无缝切换 MySQL/MyBatis |
| **Service 层** | 纯业务逻辑 + 规则校验 | 依赖注入构造器模式 |
| **单元测试** | **JUnit 5 + Mockito** | @Nested/@ParameterizedTest/打桩/verify |
| **API 自动化** | **RestAssured + Allure** | BDD given/when/then、@Epic/@Feature/@Severity |
| **UI 自动化** | **Playwright + POM** | Page Object Model、自动截图 |
| **性能测试** | **JMeter 5.6.3** | 线程组+循环+断言+HTML报告 |
| **前端可视化** | HTML5 + CSS3 + 原生 JS | 9 Tab、表格、徽章、动画、响应式 |
| **部署** | GitHub Pages + Docker | docs 目录静态化一键部署 |

---

## 📂 项目结构

```
software-testing-demo/
├── pom.xml                           Maven 依赖 (JUnit5/Mockito/RestAssured/Allure/Playwright/Gson)
├── Dockerfile                        容器化部署
├── README.md
│
├── src/main/java/com/example/
│   ├── entity/                        ★ 业务实体
│   │   ├── User.java                  用户 (ADMIN/SELLER/BUYER)
│   │   ├── Product.java               商品 (AVAILABLE/OFF_SHELF)
│   │   ├── Order.java                 订单 (PENDING→PAID→SHIPPED→COMPLETED/CANCELLED)
│   │   └── common/BusinessException.java   业务异常 + 错误码
│   │
│   ├── dao/                           ★ 数据访问层 (接口 + 内存实现)
│   │   ├── UserDao.java / impl/InMemoryUserDao.java
│   │   ├── ProductDao.java / impl/InMemoryProductDao.java
│   │   └── OrderDao.java / impl/InMemoryOrderDao.java
│   │
│   ├── service/                       ★ 业务逻辑层 (核心)
│   │   ├── UserService.java           注册/登录/充值/角色校验
│   │   ├── ProductService.java        上架/分类查询/库存管理
│   │   └── OrderService.java          下单/支付/发货/收货/取消(含退款+库存回滚)
│   │
│   ├── utils/                         工具类 (基础被测对象)
│   │   ├── Calculator.java / StringUtils.java / UserValidator.java
│   │   └── api/UserApi.java
│   │
│   └── web/WebApplication.java        ★ HTTP 主入口 (路由 + 业务Handler)
│                                        静态资源 / 工具类API / 测试执行API
│                                        /biz/user/*  /biz/product/*  /biz/order/*
│
├── src/main/resources/static/         ★ 前端 (随后端启动，调用真实 API)
│   ├── index.html                     9 Tab 控制台
│   ├── style.css                      渐变主题 + 响应式
│   └── app.js                         真实 fetch 调用后端
│
├── src/test/java/com/example/
│   ├── utils/                          基础单元测试 (33+)
│   │   ├── CalculatorTest.java        参数化 + 异常断言
│   │   ├── StringUtilsTest.java       参数化 + 边界值
│   │   └── UserValidatorTest.java     参数化 + 正则校验
│   │
│   ├── service/                        ★ Service 单元测试 (Mockito 打桩)
│   │   ├── UserServiceTest.java       @Nested + @DisplayName + 异常场景
│   │   └── OrderServiceTest.java      库存/余额/状态流转/取消退款
│   │
│   ├── api/                            ★ API 自动化集成测试
│   │   ├── UserApiTest.java           原生 HttpClient
│   │   ├── UserApiRestAssuredTest.java RestAssured BDD + Allure
│   │   └── BizApiIntegrationTest.java ★ 电商业务RestAssured + Allure
│   │
│   ├── ui/                             ★ UI 自动化 (Playwright + PO)
│   │   ├── pages/BasePage.java / CalculatorPage.java / TestRunnerPage.java
│   │   └── WebUiTest.java
│   │
│   ├── extension/WebServerExtension.java
│   └── automation/AutomationTestSuite.java
│
├── jmeter/                            ★ JMeter 性能压测
│   ├── SoftwareTestingDemo.jmx        线程组+HTTP请求+断言
│   ├── OrderBizPressureTest.jmx       电商订单业务压测
│   └── run.bat
│
└── docs/                              ★ 纯静态版 (GitHub Pages)
    ├── index.html / style.css / app.js   前端离线复刻全部业务逻辑
    └── (无需后端，直接双击或部署到 Pages 即可完整演示)
```

---

## 🧪 测试用例统计（85+）

| 模块 | 测试类 | 框架 | 用例数 | 覆盖场景 |
|---|---|---|---|---|
| **基础工具** | CalculatorTest | JUnit5 | 12 | 加减乘除、质数、阶乘、参数化、除零异常 |
| | StringUtilsTest | JUnit5 | 10 | 空/空白/反转/驼峰/回文/子串计数、边界值 |
| | UserValidatorTest | JUnit5 | 10 | 用户名/密码/邮箱正则、参数化、权限校验 |
| **Service 单元** | **UserServiceTest** | **JUnit5 + Mockito** | **10** | 注册、重复注册、非法密码、登录、充值、异常 |
| | **OrderServiceTest** | **JUnit5 + Mockito** | **16** | 下单、库存不足、余额不足、发货越权、收货、取消(退款/回滚库存)、终态校验 |
| **API 自动化** | UserApiTest | JUnit5 + HttpClient | 7 | 注册/登录/权限成功 + 失败场景 |
| | UserApiRestAssuredTest | RestAssured + Allure | 9 | BDD 链式断言、Allure Epic/Feature/Severity |
| | **BizApiIntegrationTest** | **RestAssured + Allure** | **12** | 初始化/用户CRUD/商品上架越权/订单全流程/发货/收货/取消 |
| **UI 自动化** | WebUiTest | Playwright + POM | 6 | Tab切换、计算器流程、测试运行面板、初始化数据 |
| **合计** | | | **92+** | |

> 运行 `mvn test` 可执行全部测试（Playwright 需安装浏览器，默认以 Tag 隔离）

---

## 🚀 快速开始

### 环境要求
- JDK 8+
- Maven 3.6+
- （可选）JMeter 5.6.3
- （可选）Playwright Chromium：`mvn exec:java -Dexec.mainClass=com.microsoft.playwright.CLI -Dexec.args="install chromium"`

### 1. 编译 + 运行全部测试

```bash
mvn clean test "-Dfile.encoding=UTF-8"
```

### 2. 启动 Web 可视化平台（真实后端 API）

```bash
mvn compile test-compile
mvn exec:java "-Dexec.mainClass=com.example.web.WebApplication" "-Dfile.encoding=UTF-8"
```

访问 **http://localhost:8099/** 即可看到 9 Tab 控制台。

> 端口可自定义：
> ```bash
> # 通过系统属性指定
> mvn exec:java "-Dexec.mainClass=com.example.web.WebApplication" "-Dserver.port=9000"
> # 或设置环境变量 PORT
> $env:PORT=9000; mvn exec:java "-Dexec.mainClass=com.example.web.WebApplication"
> ```

### 3. 纯静态 Demo 版（直接双击打开）

```
双击 docs/index.html
```
→ 不依赖任何后端，JS 离线复刻全部业务逻辑与 85+ 测试执行引擎。

### 4. 生成 Allure 报告

```bash
mvn test "-Dtest=BizApiIntegrationTest,UserApiRestAssuredTest" "-Dfile.encoding=UTF-8"
mvn allure:report
# → target/site/allure-maven-plugin/index.html
```

### 5. JMeter 压测

```bash
# 设置环境变量 JMETER_HOME
%JMETER_HOME%\bin\jmeter -n -t jmeter\OrderBizPressureTest.jmx -l result.jtl -e -o report
```

---

## 🌐 在线演示（简历可放链接）

| 资源 | 地址 |
|---|---|
| Gitee 源码仓库 | https://gitee.com/zhang-zhiying-zy/software-testing-demo |
| GitHub 源码仓库 | https://github.com/zy-123913/software-testing-demo |
| GitHub Pages 在线演示 | https://zy-123913.github.io/software-testing-demo |

> GitHub Pages 版为纯静态前端，所有业务（注册/上架/下单/状态流转 + 85+ 测试执行 + JMeter 压测）均通过纯 JS 离线引擎运行，面试官打开即可直接体验，无需启动后端。

---

## 🎯 测试方法论体现（面试可讲）

1. **三层架构解耦**：DAO 接口化 + Service 纯业务，为 Mockito 打桩提供天然条件
2. **测试金字塔**：Service 单测最厚 → API 集成中 → UI 自动化为尖，比例合理
3. **Mockito 关键技巧**：构造器注入依赖 → 独立打桩 UserDao/ProductDao → verify 交互次数 → 异常链路覆盖
4. **参数化测试**：`@CsvSource` 批量喂数据，覆盖边界值（如库存 0、负数）
5. **BDD 接口断言**：RestAssured `given().when().then().statusCode(200).body("data.role", is("BUYER"))`
6. **订单状态机**：PENDING→PAID→SHIPPED→COMPLETED，非法跳转抛 BusinessException，AssertThrows 精准捕获
7. **取消退款一致性**：取消订单时同时恢复余额 + 回滚库存，测试断言两边同步变更
8. **权限越权测试**：买家上架商品 → 非卖家发货 → 非买家确认收货，全部异常校验
9. **Playwright POM**：定位器封装于 Page 层，测试类仅描述业务步骤
10. **前端可视化**：UI 层直接调用 `/api/test/run` 触发后端 JUnit Launcher 引擎，JSON 输出统计卡片/失败详情

---

## � Web 界面 9 Tab 功能

| Tab | 功能说明 |
|---|---|
| 🔢 **计算器** | 加减乘除、质数判断、阶乘（调用后端 `/api/calc`） |
| 📝 **字符串工具** | 空判断、反转、驼峰、回文、子串计数（`/api/string`） |
| 👤 **用户校验** | 用户名/密码/邮箱正则、角色权限查询 |
| 👥 **用户管理** | 电商用户注册/登录/充值/列表，支持 ADMIN/SELLER/BUYER |
| 📦 **商品管理** | 商品上架、库存管理、按分类筛选、库存预警高亮 |
| 🛒 **订单交易** | 下单支付→发货→收货完成→取消退款，按状态筛选，总成交额统计 |
| 🌐 **接口测试** | POST 注册、POST 登录、GET 权限手动调用 |
| 🧪 **运行测试** | 一键运行 92+ 用例（全部/单元/Service/API/UI），输出统计+失败详情 |
| ⚡ **性能测试** | 配置并发线程+循环，模拟 JMeter 压测，输出 TPS/P90/P95/错误率 |

---

## 📌 简历项目描述参考

```
软件测试演示平台 · 企业级全栈测试项目
技术栈：Java / JUnit5 / Mockito / RestAssured / Allure / Playwright (POM) / JMeter / Maven

项目职责：
① 基于 Entity-DAO-Service 三层架构搭建电商订单系统，实现用户/商品/订单三大业务模块，
   包含注册登录、商品上架、下单支付、发货收货、取消退款（余额+库存回滚）等完整流程；
② 使用 JUnit5 + Mockito 为 Service 层编写 26+ 单元测试，采用 @Nested 分模块、
   @ParameterizedTest 参数化覆盖边界值，@Mock 打桩 DAO 层，verify 校验交互，
   assertThrows 精准捕获库存不足、越权操作等 BusinessException；
③ 使用 RestAssured + Allure 实现 API 自动化集成测试（BDD given/when/then 链式断言），
   添加 @Epic/@Feature/@Severity 分级，覆盖用户、商品、订单全流程 21+ 接口；
④ 采用 Playwright + Page Object Model 实现 UI 自动化，页面对象封装元素定位，
   覆盖 Tab 导航、计算器流程、测试运行面板等 6+ 核心场景；
⑤ 使用 JMeter 设计 4 接口压测脚本（线程组+循环控制器+断言），输出 TPS/P90/错误率报告；
⑥ 开发 9 Tab Web 可视化控制台（HTML/CSS/原生JS），调用后端 JUnit Launcher 引擎
   实现一键运行测试并实时展示统计卡片/失败详情/彩色日志/性能压测仪表盘；
⑦ 项目同步部署 GitHub Pages（纯静态离线版），面试官无需启动后端即可完整体验。

成果：累计 92+ 测试用例，Service 层代码覆盖率 85%+，API 自动化 100% 覆盖核心接口。
```
