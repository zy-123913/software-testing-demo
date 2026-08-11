package com.example.api;

import com.example.extension.WebServerExtension;
import io.qameta.allure.*;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * 使用 RestAssured + Allure 实现的接口自动化测试。
 *
 * 相比 UserApiTest（原生 HttpURLConnection），本类展示企业级 API 测试的标准化写法：
 *  - RestAssured 链式断言（given/when/then）
 *  - Allure 注解（@Feature/@Story/@Step/@Severity）生成可视化测试报告
 *  - 统一通过 WebServerExtension 管理被测服务
 */
@Epic("用户管理")
@Feature("用户接口 API")
@DisplayName("RestAssured + Allure 接口自动化测试")
class UserApiRestAssuredTest {

    @RegisterExtension
    static final WebServerExtension server = new WebServerExtension(8088);

    @BeforeAll
    static void setUp() {
        RestAssured.baseURI = server.getBaseUrl();
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();
    }

    // ====== 注册接口 ======
    @Test
    @Story("注册接口")
    @Severity(SeverityLevel.CRITICAL)
    @Description("合法用户信息注册应返回 200 + 注册成功")
    @DisplayName("注册接口 - 合法用户注册成功")
    void testRegisterSuccess() {
        // 后端从 query string 读取参数，因此用 queryParam 而非 formParam
        given().log().all()
                .queryParam("username", "newuser")
                .queryParam("password", "Pass123")
                .queryParam("email", "new@example.com")
                .when()
                .post("/api/register")
                .then().log().all()
                .statusCode(200)
                .body("code", equalTo(200))
                .body("message", containsString("注册成功"));
    }

    @Test
    @Story("注册接口")
    @Severity(SeverityLevel.NORMAL)
    @Description("非法用户信息（用户名过短、密码弱、邮箱格式错）应返回 400")
    @DisplayName("注册接口 - 非法用户注册失败")
    void testRegisterFail() {
        given()
                .queryParam("username", "x")
                .queryParam("password", "weak")
                .queryParam("email", "bad")
                .when()
                .post("/api/register")
                .then()
                .statusCode(400)
                .body("code", equalTo(400))
                .body("message", containsString("不合法"));
    }

    @Test
    @Story("注册接口")
    @Severity(SeverityLevel.MINOR)
    @Description("使用 GET 方法访问注册接口应返回 405")
    @DisplayName("注册接口 - 不允许的 HTTP 方法返回 405")
    void testRegisterWrongMethod() {
        given()
                .when()
                .get("/api/register")
                .then()
                .statusCode(405)
                .body("code", equalTo(405));
    }

    // ====== 登录接口 ======
    @Test
    @Story("登录接口")
    @Severity(SeverityLevel.BLOCKER)
    @Description("正确账号密码登录应返回 200 + token")
    @DisplayName("登录接口 - 正确账号密码登录成功")
    void testLoginSuccess() {
        Response resp = given()
                .queryParam("username", "admin")
                .queryParam("password", "Admin123")
                .when()
                .post("/api/login");
        resp.then()
                .statusCode(200)
                .body("code", equalTo(200))
                .body("message", containsString("登录成功"))
                .body("token", notNullValue())
                .body("token", startsWith("mock-token-"));
        Allure.addAttachment("登录响应", resp.asString());
    }

    @Test
    @Story("登录接口")
    @Severity(SeverityLevel.CRITICAL)
    @Description("错误密码登录应返回 401")
    @DisplayName("登录接口 - 错误密码登录失败")
    void testLoginFail() {
        given()
                .queryParam("username", "admin")
                .queryParam("password", "wrong")
                .when()
                .post("/api/login")
                .then()
                .statusCode(401)
                .body("code", equalTo(401))
                .body("message", containsString("错误"));
    }

    // ====== 权限接口 ======
    @Test
    @Story("权限接口")
    @Severity(SeverityLevel.NORMAL)
    @Description("admin 角色应返回全部权限")
    @DisplayName("权限接口 - 管理员权限")
    void testPermissionAdmin() {
        given()
                .queryParam("role", "admin")
                .when()
                .get("/api/permission")
                .then()
                .statusCode(200)
                .body("code", equalTo(200))
                .body("permission", equalTo("全部权限"));
    }

    @Test
    @Story("权限接口")
    @Severity(SeverityLevel.NORMAL)
    @Description("guest 角色应返回无权限")
    @DisplayName("权限接口 - 访客权限")
    void testPermissionGuest() {
        given()
                .queryParam("role", "guest")
                .when()
                .get("/api/permission")
                .then()
                .statusCode(200)
                .body("permission", equalTo("无权限"));
    }

    // ====== 计算器接口 ======
    @Test
    @Story("计算器接口")
    @Severity(SeverityLevel.NORMAL)
    @Description("加法接口应正确返回结果")
    @DisplayName("计算器接口 - 加法运算")
    void testCalcAdd() {
        given()
                .queryParam("a", 10)
                .queryParam("b", 3)
                .queryParam("op", "add")
                .when()
                .get("/api/calc")
                .then()
                .statusCode(200)
                .body("result", equalTo(13));
    }

    @Test
    @Story("计算器接口")
    @Severity(SeverityLevel.NORMAL)
    @Description("除数为零应返回 400 错误")
    @DisplayName("计算器接口 - 除零异常处理")
    void testCalcDivideByZero() {
        given()
                .queryParam("a", 10)
                .queryParam("b", 0)
                .queryParam("op", "div")
                .when()
                .get("/api/calc")
                .then()
                .statusCode(400)
                .body("message", containsString("除数不能为零"));
    }
}
