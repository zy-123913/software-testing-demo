package com.example.api;

import com.example.utils.UserValidator;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * 用户接口服务：基于 JDK 内置 HttpServer，提供注册 / 登录 / 权限查询接口。
 * 用于接口测试（UserApiTest）的目标服务。
 */
public class UserApi {

    private HttpServer server;
    private final UserValidator validator = new UserValidator();
    private final int port;

    public UserApi(int port) {
        this.port = port;
    }

    public void start() throws IOException {
        server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/api/register", new RegisterHandler());
        server.createContext("/api/login", new LoginHandler());
        server.createContext("/api/permission", new PermissionHandler());
        server.setExecutor(null);
        server.start();
    }

    public void stop() {
        if (server != null) {
            server.stop(0);
            server = null;
        }
    }

    private void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private Map<String, String> parseQuery(String query) {
        Map<String, String> params = new HashMap<>();
        if (query == null || query.isEmpty()) {
            return params;
        }
        for (String pair : query.split("&")) {
            String[] kv = pair.split("=", 2);
            if (kv.length == 2) {
                params.put(kv[0], kv[1]);
            }
        }
        return params;
    }

    class RegisterHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"code\":405,\"message\":\"方法不允许\"}");
                return;
            }
            Map<String, String> params = parseQuery(exchange.getRequestURI().getQuery());
            String username = params.get("username");
            String password = params.get("password");
            String email = params.get("email");
            if (validator.validateUser(username, password, email)) {
                sendResponse(exchange, 200, "{\"code\":200,\"message\":\"注册成功\"}");
            } else {
                sendResponse(exchange, 400, "{\"code\":400,\"message\":\"注册信息不合法\"}");
            }
        }
    }

    class LoginHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"code\":405,\"message\":\"方法不允许\"}");
                return;
            }
            Map<String, String> params = parseQuery(exchange.getRequestURI().getQuery());
            String username = params.get("username");
            String password = params.get("password");
            if ("admin".equals(username) && "Admin123".equals(password)) {
                sendResponse(exchange, 200, "{\"code\":200,\"message\":\"登录成功\",\"token\":\"mock-token-123\"}");
            } else {
                sendResponse(exchange, 401, "{\"code\":401,\"message\":\"用户名或密码错误\"}");
            }
        }
    }

    class PermissionHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            Map<String, String> params = parseQuery(exchange.getRequestURI().getQuery());
            String role = params.get("role");
            try {
                String permission = validator.checkPermission(role);
                sendResponse(exchange, 200,
                        "{\"code\":200,\"message\":\"ok\",\"permission\":\"" + permission + "\"}");
            } catch (IllegalArgumentException e) {
                sendResponse(exchange, 400, "{\"code\":400,\"message\":\"" + e.getMessage() + "\"}");
            }
        }
    }
}
