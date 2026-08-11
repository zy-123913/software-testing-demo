package com.example.api;

import com.example.extension.WebServerExtension;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import io.qameta.allure.Description;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Link;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import io.qameta.allure.restassured.AllureRestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.extension.RegisterExtension;

import java.lang.reflect.Type;
import java.util.List;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * 电商业务 REST API 集成测试
 *  - 覆盖用户注册/登录/充值、商品 CRUD、订单下单/发货/收货/取消 等核心业务接口
 *  - 端到端执行真实 HTTP 请求（启动嵌入式服务器），BDD 风格断言
 *  - Allure 注解：Epic/Feature/Story/Severity 支持生成分层测试报告
 */
@Epic("电商订单系统")
@Feature("业务 API 集成测试")
@Tag("biz")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class BizApiIntegrationTest {

    @RegisterExtension
    static WebServerExtension server = new WebServerExtension();

    private static final Gson GSON = new Gson();
    private static final Type MAP_TYPE = new TypeToken<Map<String, Object>>() {}.getType();

    private static Long sellerId;
    private static Long buyerId;
    private static Long productId;
    private static Long orderId;

    @SuppressWarnings("unchecked")
    private static Map<String, Object> toMap(String json) {
        return GSON.fromJson(json, MAP_TYPE);
    }

    @SuppressWarnings("unchecked")
    private static Long idOf(Object o) {
        if (o instanceof Number) return ((Number) o).longValue();
        if (o instanceof Map) return idOf(((Map<String, Object>) o).get("id"));
        return Long.valueOf(String.valueOf(o));
    }

    @BeforeAll
    static void initData() {
        // 启动后初始化测试数据（admin/seller/buyer + 4 商品）
        given().filter(new AllureRestAssured())
                .port(server.getPort())
                .basePath("/biz/init")
                .when().get()
                .then()
                .statusCode(200)
                .body("code", equalTo(200));
        // 通过 Gson 解析原生 JSON（完全绕开 RestAssured Groovy 路径语法问题）
        String userBody = given().port(server.getPort()).get("/biz/user/list").asString();
        String prodBody = given().port(server.getPort()).get("/biz/product/list").asString();
        Map<String, Object> userResp = toMap(userBody);
        Map<String, Object> prodResp = toMap(prodBody);
        List<Map<String, Object>> users = (List<Map<String, Object>>) userResp.get("data");
        List<Map<String, Object>> prods = (List<Map<String, Object>>) prodResp.get("data");
        sellerId = idOf(users.stream().filter(u -> "SELLER".equals(u.get("role"))).findFirst().get());
        buyerId  = idOf(users.stream().filter(u -> "BUYER".equals(u.get("role"))).findFirst().get());
        productId = idOf(prods.get(0));
    }

    // ====== 用户模块 ======
    @Nested
    @DisplayName("用户业务 API")
    @Feature("用户管理 API")
    class UserApi {
        @Test
        @Order(1)
        @Story("用户注册")
        @Severity(SeverityLevel.CRITICAL)
        @Description("注册新 BUYER 账号，参数合法，返回 200 且包含 id")
        void registerBuyer() {
            given().filter(new AllureRestAssured())
                    .port(server.getPort())
                    .basePath("/biz/user/register")
                    .queryParam("username", "buyer_api_" + System.currentTimeMillis())
                    .queryParam("password", "BuyerAbc123")
                    .queryParam("email", "buyer_api@example.com")
                    .queryParam("role", "BUYER")
                    .contentType(ContentType.URLENC)
                    .when().post()
                    .then()
                    .statusCode(200)
                    .body("code", equalTo(200))
                    .body("data.id", notNullValue())
                    .body("data.role", equalTo("BUYER"));
        }

        @Test
        @Order(2)
        @Story("用户登录")
        @Severity(SeverityLevel.CRITICAL)
        void loginSuccess() {
            given().port(server.getPort())
                    .basePath("/biz/user/login")
                    .queryParam("username", "buyer01")
                    .queryParam("password", "Buyer123")
                    .when().post()
                    .then()
                    .statusCode(200)
                    .body("code", equalTo(200))
                    .body("data.status", equalTo(1));
        }

        @Test
        @Order(3)
        @Story("用户登录")
        @Severity(SeverityLevel.NORMAL)
        void loginFailWrongPwd() {
            given().port(server.getPort())
                    .basePath("/biz/user/login")
                    .queryParam("username", "buyer01")
                    .queryParam("password", "Wrong123")
                    .when().post()
                    .then()
                    .statusCode(401)
                    .body("message", containsString("用户名或密码错误"));
        }

        @Test
        @Order(4)
        @Story("余额充值")
        @Severity(SeverityLevel.CRITICAL)
        void rechargeSuccess() {
            given().port(server.getPort())
                    .basePath("/biz/user/recharge")
                    .queryParam("userId", buyerId)
                    .queryParam("amount", 50000) // +500 元
                    .when().post()
                    .then()
                    .statusCode(200)
                    .body("code", equalTo(200))
                    .body("data", greaterThanOrEqualTo(50000));
        }

        @Test
        @Order(5)
        @Story("列表查询")
        @Severity(SeverityLevel.MINOR)
        void listUsersSizeAtLeast3() {
            given().port(server.getPort())
                    .when().get("/biz/user/list")
                    .then()
                    .statusCode(200)
                    .body("data.size()", greaterThanOrEqualTo(3));
        }

        @Test
        @Order(6)
        @Story("充值写入交易记录")
        @Severity(SeverityLevel.CRITICAL)
        void rechargeWritesTx() {
            given().port(server.getPort())
                    .basePath("/biz/user/recharge")
                    .queryParam("userId", buyerId)
                    .queryParam("amount", 10000)
                    .when().post()
                    .then()
                    .statusCode(200)
                    .body("code", equalTo(200));
            String body = given().port(server.getPort())
                    .basePath("/biz/user/transactions")
                    .queryParam("userId", buyerId)
                    .when().get()
                    .then()
                    .statusCode(200)
                    .body("code", equalTo(200))
                    .extract().asString();
            Map<String, Object> resp = toMap(body);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> txList = (List<Map<String, Object>>) resp.get("data");
            Assertions.assertNotNull(txList, "data 应为 List");
            Assertions.assertTrue(txList instanceof java.util.List, "data 应是 List");
            boolean found = false;
            for (Map<String, Object> tx : txList) {
                int amt = ((Number) tx.get("amount")).intValue();
                String type = String.valueOf(tx.get("type"));
                if (amt == 10000 || ("RECHARGE".equals(type) && amt > 0)) {
                    found = true;
                    break;
                }
            }
            Assertions.assertTrue(found, "至少存在一条 amount=10000 或 (type=RECHARGE 且 amount>0) 的交易记录");
        }

        @Test
        @Order(7)
        @Story("查询不存在用户的交易记录")
        @Severity(SeverityLevel.NORMAL)
        void transactionsInvalidUser() {
            io.restassured.response.Response resp = given().port(server.getPort())
                    .basePath("/biz/user/transactions")
                    .queryParam("userId", 99999)
                    .when().get()
                    .then()
                    .extract().response();
            int sc = resp.statusCode();
            if (sc == 404) {
                return;
            }
            String body = resp.asString();
            Map<String, Object> bodyMap = toMap(body);
            Object code = bodyMap.get("code");
            Assertions.assertTrue(sc == 404 || (code != null && ((Number) code).intValue() == 404),
                    "状态码或 body.code 任一为 404，实际 statusCode=" + sc + ", code=" + code);
        }
    }

    // ====== 商品模块 ======
    @Nested
    @DisplayName("商品业务 API")
    @Feature("商品管理 API")
    class ProductApi {
        @Test
        @Order(10)
        @Story("商品创建")
        @Severity(SeverityLevel.CRITICAL)
        void createProduct() {
            given().port(server.getPort())
                    .basePath("/biz/product/create")
                    .queryParam("name", "测试商品-" + System.currentTimeMillis())
                    .queryParam("price", 19900)
                    .queryParam("stock", 888)
                    .queryParam("category", "测试分类")
                    .queryParam("sellerId", sellerId)
                    .when().post()
                    .then()
                    .statusCode(200)
                    .body("code", equalTo(200))
                    .body("data.id", notNullValue())
                    .body("data.stock", equalTo(888));
        }

        @Test
        @Order(11)
        @Story("商品列表")
        void listByCategory() {
            given().port(server.getPort())
                    .basePath("/biz/product/list")
                    .queryParam("category", "电子产品")
                    .when().get()
                    .then()
                    .statusCode(200)
                    .body("data.category", everyItem(equalTo("电子产品")));
        }

        @Test
        @Order(12)
        @Story("创建商品参数校验")
        void createInvalidPrice() {
            given().port(server.getPort())
                    .basePath("/biz/product/create")
                    .queryParam("name", "Bad")
                    .queryParam("price", -1)
                    .queryParam("stock", 10)
                    .queryParam("category", "x")
                    .queryParam("sellerId", sellerId)
                    .when().post()
                    .then()
                    .statusCode(400)
                    .body("message", containsString("价格"));
        }

        @Test
        @Order(13)
        @Story("商品关键词搜索")
        @Severity(SeverityLevel.NORMAL)
        void searchKeyword() {
            String body = given().port(server.getPort())
                    .basePath("/biz/product/search")
                    .queryParam("keyword", "iPhone")
                    .when().get()
                    .then()
                    .statusCode(200)
                    .body("code", equalTo(200))
                    .body("data.total", greaterThanOrEqualTo(1))
                    .body("data.page", equalTo(1))
                    .body("data.size", equalTo(10))
                    .body("data.totalPages", greaterThanOrEqualTo(1))
                    .extract().asString();
            Map<String, Object> resp = toMap(body);
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) resp.get("data");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> list = (List<Map<String, Object>>) data.get("list");
            for (Map<String, Object> item : list) {
                String name = String.valueOf(item.get("name"));
                Assertions.assertTrue(name.toLowerCase().contains("iphone".toLowerCase()),
                        "商品名 " + name + " 应包含 iPhone (大小写不敏感)");
            }
        }

        @Test
        @Order(14)
        @Story("按分类分页搜索商品")
        @Severity(SeverityLevel.NORMAL)
        void searchCategoryAndPage() {
            String body = given().port(server.getPort())
                    .basePath("/biz/product/search")
                    .queryParam("category", "电子产品")
                    .queryParam("page", 1)
                    .queryParam("size", 2)
                    .when().get()
                    .then()
                    .statusCode(200)
                    .body("code", equalTo(200))
                    .extract().asString();
            Map<String, Object> resp = toMap(body);
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) resp.get("data");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> list = (List<Map<String, Object>>) data.get("list");
            Assertions.assertNotNull(list, "data.list 不应为 null");
            Assertions.assertTrue(list instanceof java.util.List, "data.list 应是 List");
            Assertions.assertTrue(list.size() <= 2, "list.size() 应 <= 2，实际: " + list.size());
            for (Map<String, Object> item : list) {
                Assertions.assertEquals("电子产品", item.get("category"),
                        "每条商品 category 应为 电子产品");
            }
        }

        @Test
        @Order(15)
        @Story("空关键词搜索商品")
        @Severity(SeverityLevel.MINOR)
        void searchEmptyKeyword() {
            String body = given().port(server.getPort())
                    .basePath("/biz/product/search")
                    .queryParam("keyword", "")
                    .queryParam("size", 100)
                    .when().get()
                    .then()
                    .statusCode(200)
                    .body("code", equalTo(200))
                    .extract().asString();
            Map<String, Object> resp = toMap(body);
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) resp.get("data");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> list = (List<Map<String, Object>>) data.get("list");
            int total = ((Number) data.get("total")).intValue();
            Assertions.assertTrue(total >= list.size(),
                    "total(" + total + ") 应 >= list.size(" + list.size() + ")");
        }
    }

    // ====== 订单模块（核心业务链路） ======
    @Nested
    @DisplayName("订单业务 API")
    @Feature("订单全生命周期 API")
    class OrderApi {
        @Test
        @Order(20)
        @Story("买家下单")
        @Severity(SeverityLevel.BLOCKER)
        @Link(name = "订单创建接口", url = "/biz/order/create")
        @Description("端到端下单测试：扣库存→扣余额→生成订单号")
        void createOrder() {
            // 先给买家充值避免受其他测试影响
            given().port(server.getPort())
                    .basePath("/biz/user/recharge")
                    .queryParam("userId", buyerId)
                    .queryParam("amount", 1_000_000)
                    .when().post();
            Long cheapPid = firstProductId();
            io.restassured.response.Response resp = given().filter(new AllureRestAssured())
                    .port(server.getPort())
                    .basePath("/biz/order/create")
                    .queryParam("buyerId", buyerId)
                    .queryParam("productId", cheapPid)
                    .queryParam("quantity", 1)
                    .queryParam("address", "北京市朝阳区 xx 路 100 号")
                    .when().post()
                    .then()
                    .statusCode(200)
                    .body("code", equalTo(200))
                    .body("data.status", equalTo("PAID"))
                    .body("data.orderNo", startsWith("NO"))
                    .body("data.totalAmount", greaterThan(0))
                    .extract().response();
            orderId = ((Number) resp.path("data.id")).longValue();
            Assertions.assertNotNull(orderId, "订单 ID 必须返回");
        }

        private Long firstProductId() {
            String body = given().port(server.getPort()).get("/biz/product/list").asString();
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> list = (List<Map<String, Object>>) toMap(body).get("data");
            Assertions.assertFalse(list == null || list.isEmpty(), "商品列表不能为空");
            return ((Number) list.get(0).get("id")).longValue();
        }

        @Test
        @Order(21)
        @Story("卖家发货")
        @Severity(SeverityLevel.CRITICAL)
        void shipOrder() {
            // 自包含：先充值→建单→再发货
            given().port(server.getPort())
                    .basePath("/biz/user/recharge")
                    .queryParam("userId", buyerId)
                    .queryParam("amount", 1_000_000)
                    .when().post();
            Long pid = firstProductId();
            Long localOrderId = ((Number) given().port(server.getPort())
                    .basePath("/biz/order/create")
                    .queryParam("buyerId", buyerId)
                    .queryParam("productId", pid)
                    .queryParam("quantity", 1)
                    .queryParam("address", "上海市 xx 路")
                    .when().post()
                    .then().statusCode(200).extract().path("data.id")).longValue();
            given().port(server.getPort())
                    .basePath("/biz/order/ship")
                    .queryParam("orderId", localOrderId)
                    .queryParam("sellerId", sellerId)
                    .when().post()
                    .then()
                    .statusCode(200)
                    .body("data.status", equalTo("SHIPPED"));
        }

        @Test
        @Order(22)
        @Story("订单全流程 - 下单→发货→确认收货")
        @Severity(SeverityLevel.CRITICAL)
        void fullOrderLifecycle() {
            // 1) 充值
            given().port(server.getPort())
                    .basePath("/biz/user/recharge")
                    .queryParam("userId", buyerId)
                    .queryParam("amount", 1_000_000)
                    .when().post();
            // 2) 找商品
            Long pid = firstProductId();
            // 3) 下单（PAID）
            io.restassured.response.Response createResp = given().port(server.getPort())
                    .basePath("/biz/order/create")
                    .queryParam("buyerId", buyerId)
                    .queryParam("productId", pid)
                    .queryParam("quantity", 1)
                    .queryParam("address", "广州市天河区珠江新城 1 号")
                    .when().post()
                    .then().statusCode(200).extract().response();
            Long localOrderId = ((Number) createResp.path("data.id")).longValue();
            Assertions.assertEquals("PAID", createResp.path("data.status"));
            // 4) 卖家发货（SHIPPED）
            io.restassured.response.Response shipResp = given().port(server.getPort())
                    .basePath("/biz/order/ship")
                    .queryParam("orderId", localOrderId)
                    .queryParam("sellerId", sellerId)
                    .when().post()
                    .then().statusCode(200).extract().response();
            Assertions.assertEquals("SHIPPED", shipResp.path("data.status"));
            // 5) 买家确认收货（COMPLETED）
            given().port(server.getPort())
                    .basePath("/biz/order/complete")
                    .queryParam("orderId", localOrderId)
                    .queryParam("buyerId", buyerId)
                    .when().post()
                    .then()
                    .statusCode(200)
                    .body("code", equalTo(200))
                    .body("data.status", equalTo("COMPLETED"));
        }

        @Test
        @Order(23)
        @Story("非卖家禁止发货")
        @Severity(SeverityLevel.NORMAL)
        void shipByBuyerForbidden() {
            Long bid = buyerId;
            // 找到最便宜的商品（避免余额不足），并给买家补一次余额
            given().port(server.getPort())
                    .basePath("/biz/user/recharge")
                    .queryParam("userId", bid)
                    .queryParam("amount", 1_000_000)
                    .when().post();
            String prodBody = given().port(server.getPort()).get("/biz/product/list").asString();
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> prodList = (List<Map<String, Object>>) toMap(prodBody).get("data");
            Long cheapId = idOf(prodList.stream()
                    .min((a, b) -> Integer.compare(((Number) a.get("price")).intValue(), ((Number) b.get("price")).intValue()))
                    .get());
            Long tmpOrder = ((Number) given().port(server.getPort())
                    .basePath("/biz/order/create")
                    .queryParam("buyerId", bid)
                    .queryParam("productId", cheapId)
                    .queryParam("quantity", 1)
                    .queryParam("address", "addr")
                    .when().post().then()
                    .log().ifValidationFails()
                    .statusCode(200)
                    .extract().path("data.id")).longValue();

            given().port(server.getPort())
                    .basePath("/biz/order/ship")
                    .queryParam("orderId", tmpOrder)
                    .queryParam("sellerId", bid) // 买家来发货，越权
                    .when().post()
                    .then()
                    .log().ifValidationFails()
                    .statusCode(403);
        }

        @Test
        @Order(24)
        @Story("管理员取消订单")
        @Severity(SeverityLevel.NORMAL)
        void adminCancelOrder() {
            Long bid2 = buyerId;
            // 充值 + 使用最便宜商品，避免余额/库存问题
            given().port(server.getPort())
                    .basePath("/biz/user/recharge")
                    .queryParam("userId", bid2)
                    .queryParam("amount", 1_000_000)
                    .when().post();
            String prodBody = given().port(server.getPort()).get("/biz/product/list").asString();
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> prodList = (List<Map<String, Object>>) toMap(prodBody).get("data");
            Long cheapId = idOf(prodList.stream()
                    .min((a, b) -> Integer.compare(((Number) a.get("price")).intValue(), ((Number) b.get("price")).intValue()))
                    .get());
            Long tmpOrder2 = ((Number) given().port(server.getPort())
                    .basePath("/biz/order/create")
                    .queryParam("buyerId", bid2)
                    .queryParam("productId", cheapId)
                    .queryParam("quantity", 1)
                    .queryParam("address", "addr")
                    .when().post().then()
                    .log().ifValidationFails()
                    .statusCode(200)
                    .extract().path("data.id")).longValue();

            String adminJson = given().port(server.getPort()).get("/biz/user/list").asString();
            Map<String, Object> adminResp = toMap(adminJson);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> allUsers = (List<Map<String, Object>>) adminResp.get("data");
            Long adminId = idOf(allUsers.stream().filter(u -> "ADMIN".equals(u.get("role")))
                    .findFirst().get());

            given().port(server.getPort())
                    .basePath("/biz/order/cancel")
                    .queryParam("orderId", tmpOrder2)
                    .queryParam("operatorId", adminId)
                    .when().post()
                    .then()
                    .statusCode(200)
                    .body("data.status", equalTo("CANCELLED"));
        }

        @Test
        @Order(25)
        @Story("按买家查订单列表")
        void listByBuyer() {
            given().port(server.getPort())
                    .basePath("/biz/order/list")
                    .queryParam("buyerId", buyerId)
                    .when().get()
                    .then()
                    .statusCode(200)
                    .body("data", instanceOf(java.util.List.class));
        }

        @Test
        @Order(30)
        @Story("已支付订单买家申请退款")
        @Severity(SeverityLevel.CRITICAL)
        void refundAfterPaid() {
            given().port(server.getPort())
                    .basePath("/biz/user/recharge")
                    .queryParam("userId", buyerId)
                    .queryParam("amount", 1_000_000)
                    .when().post();
            Long pid = firstProductId();
            Long localOrderId = ((Number) given().port(server.getPort())
                    .basePath("/biz/order/create")
                    .queryParam("buyerId", buyerId)
                    .queryParam("productId", pid)
                    .queryParam("quantity", 1)
                    .queryParam("address", "退款测试地址")
                    .when().post()
                    .then().statusCode(200).extract().path("data.id")).longValue();
            given().port(server.getPort())
                    .basePath("/biz/order/refund")
                    .queryParam("orderId", localOrderId)
                    .queryParam("operatorId", buyerId)
                    .when().post()
                    .then()
                    .statusCode(200)
                    .body("code", equalTo(200))
                    .body("data.status", equalTo("REFUNDED"))
                    .body("data.refundedAt", notNullValue());
        }

        @Test
        @Order(31)
        @Story("管理员为已完成订单退款")
        @Severity(SeverityLevel.CRITICAL)
        void refundByAdminForCompleted() {
            given().port(server.getPort())
                    .basePath("/biz/user/recharge")
                    .queryParam("userId", buyerId)
                    .queryParam("amount", 1_000_000)
                    .when().post();
            Long pid = firstProductId();
            Long localOrderId = ((Number) given().port(server.getPort())
                    .basePath("/biz/order/create")
                    .queryParam("buyerId", buyerId)
                    .queryParam("productId", pid)
                    .queryParam("quantity", 1)
                    .queryParam("address", "管理员退款测试地址")
                    .when().post()
                    .then().statusCode(200).extract().path("data.id")).longValue();
            given().port(server.getPort())
                    .basePath("/biz/order/ship")
                    .queryParam("orderId", localOrderId)
                    .queryParam("sellerId", sellerId)
                    .when().post()
                    .then().statusCode(200);
            given().port(server.getPort())
                    .basePath("/biz/order/complete")
                    .queryParam("orderId", localOrderId)
                    .queryParam("buyerId", buyerId)
                    .when().post()
                    .then().statusCode(200);
            String userListJson = given().port(server.getPort()).get("/biz/user/list").asString();
            Map<String, Object> userListResp = toMap(userListJson);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> allUsers = (List<Map<String, Object>>) userListResp.get("data");
            Long adminId = idOf(allUsers.stream().filter(u -> "ADMIN".equals(u.get("role")))
                    .findFirst().get());
            given().port(server.getPort())
                    .basePath("/biz/order/refund")
                    .queryParam("orderId", localOrderId)
                    .queryParam("operatorId", adminId)
                    .when().post()
                    .then()
                    .statusCode(200)
                    .body("code", equalTo(200))
                    .body("data.status", equalTo("REFUNDED"));
        }
    }
}
