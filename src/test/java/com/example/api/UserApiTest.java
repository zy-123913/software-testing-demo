package com.example.api;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 用户接口测试：启动 UserApi HTTP 服务，对注册 / 登录 / 权限接口进行端到端测试。
 */
@DisplayName("用户接口测试")
class UserApiTest {

    private static UserApi userApi;
    private static final int PORT = 18080;

    @BeforeAll
    static void startServer() throws Exception {
        userApi = new UserApi(PORT);
        userApi.start();
        // 等待服务就绪
        Thread.sleep(200);
    }

    @AfterAll
    static void stopServer() {
        userApi.stop();
    }

    private HttpResponse sendRequest(String path, String method, String query) throws Exception {
        String urlStr = "http://localhost:" + PORT + path;
        if (query != null) {
            urlStr += "?" + query;
        }
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod(method);
        conn.setConnectTimeout(3000);
        conn.setReadTimeout(3000);
        int code = conn.getResponseCode();
        InputStream is = (code >= 400) ? conn.getErrorStream() : conn.getInputStream();
        String body = readStream(is);
        conn.disconnect();
        return new HttpResponse(code, body);
    }

    private String readStream(InputStream is) throws IOException {
        if (is == null) {
            return "";
        }
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(is, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            return sb.toString();
        }
    }

    private String param(String key, String value) throws UnsupportedEncodingException {
        return key + "=" + URLEncoder.encode(value, StandardCharsets.UTF_8.name());
    }

    @Test
    @DisplayName("注册接口 - 合法用户注册成功")
    void testRegisterSuccess() throws Exception {
        String query = param("username", "newuser") + "&"
                + param("password", "Pass123") + "&"
                + param("email", "new@example.com");
        HttpResponse resp = sendRequest("/api/register", "POST", query);
        assertEquals(200, resp.code);
        assertTrue(resp.body.contains("注册成功"));
    }

    @Test
    @DisplayName("注册接口 - 非法用户注册失败")
    void testRegisterFail() throws Exception {
        String query = param("username", "x") + "&"
                + param("password", "weak") + "&"
                + param("email", "bad");
        HttpResponse resp = sendRequest("/api/register", "POST", query);
        assertEquals(400, resp.code);
        assertTrue(resp.body.contains("不合法"));
    }

    @Test
    @DisplayName("登录接口 - 正确账号密码登录成功")
    void testLoginSuccess() throws Exception {
        String query = param("username", "admin") + "&"
                + param("password", "Admin123");
        HttpResponse resp = sendRequest("/api/login", "POST", query);
        assertEquals(200, resp.code);
        assertTrue(resp.body.contains("token"));
        assertTrue(resp.body.contains("登录成功"));
    }

    @Test
    @DisplayName("登录接口 - 错误账号密码登录失败")
    void testLoginFail() throws Exception {
        String query = param("username", "admin") + "&"
                + param("password", "wrong");
        HttpResponse resp = sendRequest("/api/login", "POST", query);
        assertEquals(401, resp.code);
        assertTrue(resp.body.contains("错误"));
    }

    @Test
    @DisplayName("权限接口 - 查询管理员权限")
    void testPermissionAdmin() throws Exception {
        HttpResponse resp = sendRequest("/api/permission", "GET", param("role", "admin"));
        assertEquals(200, resp.code);
        assertTrue(resp.body.contains("全部权限"));
    }

    @Test
    @DisplayName("权限接口 - 查询访客权限")
    void testPermissionGuest() throws Exception {
        HttpResponse resp = sendRequest("/api/permission", "GET", param("role", "guest"));
        assertEquals(200, resp.code);
        assertTrue(resp.body.contains("无权限"));
    }

    @Test
    @DisplayName("注册接口 - 不允许的 HTTP 方法返回 405")
    void testRegisterWrongMethod() throws Exception {
        HttpResponse resp = sendRequest("/api/register", "GET", null);
        assertEquals(405, resp.code);
    }

    private static class HttpResponse {
        final int code;
        final String body;

        HttpResponse(int code, String body) {
            this.code = code;
            this.body = body;
        }
    }
}
