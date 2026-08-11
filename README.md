# 软件测试演示平台 🧪

> 基于 JUnit 5 的软件测试演示项目，包含单元测试、接口测试、自动化测试套件，并提供前后端一体化的可视化 Web 界面。

## ✨ 项目特点

- **前后端一体化**：JDK 内置 HttpServer 提供后端 API + 静态前端页面，零外部容器依赖
- **70+ 测试用例**：覆盖单元测试、参数化测试、异常测试、接口测试、测试套件
- **可视化测试执行**：在浏览器中一键运行测试，实时展示通过/失败统计与详细日志
- **多种测试方法**：基本断言、参数化测试（`@ParameterizedTest`）、异常测试（`@assertThrows`）、生命周期回调、测试套件（`@Suite`）

## 🖥️ 在线 Demo

访问地址：[https://software-testing-demo.onrender.com](https://software-testing-demo.onrender.com)

> 免费版服务在 15 分钟无访问后会休眠，首次打开可能需要等待约 30 秒冷启动。

## 📂 项目结构

```
src/
├── main/java/com/example/
│   ├── utils/
│   │   ├── Calculator.java       计算器工具类
│   │   ├── StringUtils.java      字符串处理工具类
│   │   └── UserValidator.java    用户校验工具类
│   ├── api/
│   │   └── UserApi.java          HTTP 接口服务（注册/登录/权限）
│   └── web/
│       └── WebApplication.java   Web 应用主入口
├── main/resources/static/
│   ├── index.html                前端页面
│   ├── style.css                 样式
│   └── app.js                    交互脚本
└── test/java/com/example/
    ├── utils/
    │   ├── CalculatorTest.java   计算器单元测试
    │   ├── StringUtilsTest.java  字符串单元测试
    │   └── UserValidatorTest.java 用户校验单元测试
    ├── api/
    │   └── UserApiTest.java      接口测试
    └── automation/
        └── AutomationTestSuite.java 自动化测试套件
```

## 🚀 本地运行

### 环境要求
- JDK 8+
- Maven 3.6+

### 启动

```bash
mvn compile test-compile
mvn exec:java
```

访问 http://localhost:8080/

### 运行测试

```bash
# 运行全部测试
mvn test

# 只运行自动化测试套件
mvn test -Dtest=AutomationTestSuite
```

## 🐳 Docker 部署

```bash
docker build -t software-testing-demo .
docker run -p 8080:8080 software-testing-demo
```

## 🧪 测试方法说明

| 测试类型 | 示例 | 用例数 |
|---|---|---|
| 基本断言测试 | `assertEquals`, `assertTrue` | 10+ |
| 参数化测试 | `@ParameterizedTest` + `@CsvSource` | 30+ |
| 异常测试 | `assertThrows` | 5+ |
| 生命周期测试 | `@BeforeEach`, `@AfterEach` | - |
| HTTP 接口测试 | 端到端 HTTP 请求验证 | 7 |
| 自动化测试套件 | `@Suite` + `@SelectPackages` | 70 |

## 🛠️ 技术栈

- **后端**：Java 8 + JDK HttpServer + JUnit Platform Launcher
- **前端**：原生 HTML/CSS/JavaScript（无框架依赖）
- **测试**：JUnit 5 (Jupiter) + JUnit Platform Suite
- **构建**：Maven
- **部署**：Docker + Render
