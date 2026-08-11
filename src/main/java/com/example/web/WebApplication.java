package com.example.web;

import com.example.api.UserApi;
import com.example.utils.Calculator;
import com.example.utils.StringUtils;
import com.example.utils.UserValidator;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import org.junit.platform.engine.discovery.DiscoverySelectors;
import org.junit.platform.launcher.Launcher;
import org.junit.platform.launcher.LauncherDiscoveryRequest;
import org.junit.platform.launcher.core.LauncherDiscoveryRequestBuilder;
import org.junit.platform.launcher.core.LauncherFactory;
import org.junit.platform.launcher.listeners.SummaryGeneratingListener;
import org.junit.platform.launcher.listeners.TestExecutionSummary;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Web 应用主入口：启动 HTTP 服务，提供
 *  - 静态资源（前端页面）
 *  - 工具类 API（计算器 / 字符串 / 用户校验）
 *  - 测试执行 API（运行 JUnit 测试并返回 JSON 结果）
 */
public class WebApplication {

    private static final int PORT = 8080;
    private HttpServer server;

    private final Calculator calculator = new Calculator();
    private final StringUtils stringUtils = new StringUtils();
    private final UserValidator userValidator = new UserValidator();

    public static void main(String[] args) throws Exception {
        // 云平台（Render/Heroku 等）通过 PORT 环境变量指定端口；本地默认 8080
        int port = parseInt(System.getenv().getOrDefault("PORT", String.valueOf(PORT)));
        WebApplication app = new WebApplication();
        app.start(port);
        System.out.println("============================================");
        System.out.println("  软件测试演示平台已启动");
        System.out.println("  访问地址: http://localhost:" + port + "/");
        System.out.println("  按 Ctrl+C 停止服务");
        System.out.println("============================================");
    }

    private static int parseInt(String s) {
        try { return Integer.parseInt(s.trim()); }
        catch (Exception e) { return PORT; }
    }

    public void start(int port) throws IOException {
        server = HttpServer.create(new InetSocketAddress(port), 0);

        // 静态资源（前端页面）
        server.createContext("/", new StaticHandler());
        // 计算器 API
        server.createContext("/api/calc", new CalcHandler());
        // 字符串处理 API
        server.createContext("/api/string", new StringHandler());
        // 用户校验 API
        server.createContext("/api/user", new UserHandler());
        // 测试执行 API
        server.createContext("/api/test/run", new TestRunHandler());
        // 性能测试 API（模拟 JMeter 压测）
        server.createContext("/api/test/perf", new PerfHandler());

        // 复用用户接口（注册 / 登录 / 权限）
        server.createContext("/api/register", new RegisterHandler());
        server.createContext("/api/login", new LoginHandler());
        server.createContext("/api/permission", new PermissionHandler());

        server.setExecutor(java.util.concurrent.Executors.newFixedThreadPool(64));
        server.start();
    }

    public void stop() {
        if (server != null) {
            server.stop(0);
            server = null;
        }
    }

    // ====== 通用辅助方法 ======
    private void sendJson(HttpExchange ex, int code, Object data) throws IOException {
        String json = toJson(data);
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        ex.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        ex.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(bytes);
        }
    }

    private Map<String, String> parseQuery(String query) throws Exception {
        Map<String, String> params = new HashMap<>();
        if (query == null || query.isEmpty()) return params;
        for (String pair : query.split("&")) {
            String[] kv = pair.split("=", 2);
            if (kv.length == 2) {
                params.put(URLDecoder.decode(kv[0], "UTF-8"),
                        URLDecoder.decode(kv[1], "UTF-8"));
            }
        }
        return params;
    }

    private String toJson(Object obj) {
        StringBuilder sb = new StringBuilder();
        appendJson(sb, obj);
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private void appendJson(StringBuilder sb, Object obj) {
        if (obj == null) {
            sb.append("null");
        } else if (obj instanceof String) {
            sb.append('"').append(((String) obj)
                    .replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t")).append('"');
        } else if (obj instanceof Boolean || obj instanceof Number) {
            sb.append(obj.toString());
        } else if (obj instanceof Map) {
            sb.append('{');
            boolean first = true;
            for (Map.Entry<?, ?> e : ((Map<?, ?>) obj).entrySet()) {
                if (!first) sb.append(',');
                first = false;
                sb.append('"').append(e.getKey()).append("\":");
                appendJson(sb, e.getValue());
            }
            sb.append('}');
        } else if (obj instanceof List) {
            sb.append('[');
            boolean first = true;
            for (Object o : (List<?>) obj) {
                if (!first) sb.append(',');
                first = false;
                appendJson(sb, o);
            }
            sb.append(']');
        } else {
            sb.append('"').append(obj.toString()).append('"');
        }
    }

    // ====== 静态资源处理器 ======
    class StaticHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            String path = ex.getRequestURI().getPath();
            if ("/".equals(path)) path = "/index.html";
            String resource = "/static" + path;

            InputStream is = getClass().getResourceAsStream(resource);
            if (is == null) {
                String notFound = "{\"code\":404,\"message\":\"Not Found\"}";
                sendJson(ex, 404, notFound);
                return;
            }

            byte[] data = readAll(is);
            String type = "text/html; charset=UTF-8";
            if (path.endsWith(".css")) type = "text/css; charset=UTF-8";
            else if (path.endsWith(".js")) type = "application/javascript; charset=UTF-8";
            else if (path.endsWith(".png") || path.endsWith(".jpg")) type = "image/*";

            ex.getResponseHeaders().set("Content-Type", type);
            ex.sendResponseHeaders(200, data.length);
            try (OutputStream os = ex.getResponseBody()) {
                os.write(data);
            }
        }
    }

    private byte[] readAll(InputStream is) throws IOException {
        byte[] buf = new byte[8192];
        int len;
        java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
        while ((len = is.read(buf)) != -1) bos.write(buf, 0, len);
        is.close();
        return bos.toByteArray();
    }

    // ====== 计算器 API ======
    class CalcHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            try {
                Map<String, String> p = parseQuery(ex.getRequestURI().getQuery());
                String op = p.get("op");
                int a = Integer.parseInt(p.getOrDefault("a", "0"));
                int b = Integer.parseInt(p.getOrDefault("b", "0"));

                Map<String, Object> result = new LinkedHashMap<>();
                result.put("code", 200);
                result.put("a", a);
                result.put("b", b);
                result.put("op", op);
                switch (op == null ? "" : op) {
                    case "add": result.put("result", calculator.add(a, b)); break;
                    case "sub": result.put("result", calculator.subtract(a, b)); break;
                    case "mul": result.put("result", calculator.multiply(a, b)); break;
                    case "div": result.put("result", calculator.divide(a, b)); break;
                    case "isPrime": result.put("result", calculator.isPrime(a)); break;
                    case "factorial": result.put("result", calculator.factorial(a)); break;
                    default:
                        sendJson(ex, 400, error(400, "未知操作: " + op));
                        return;
                }
                sendJson(ex, 200, result);
            } catch (ArithmeticException | IllegalArgumentException e) {
                sendJson(ex, 400, error(400, e.getMessage()));
            } catch (Exception e) {
                sendJson(ex, 500, error(500, e.getMessage()));
            }
        }
    }

    // ====== 字符串处理 API ======
    class StringHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            try {
                Map<String, String> p = parseQuery(ex.getRequestURI().getQuery());
                String op = p.getOrDefault("op", "");
                String s = p.getOrDefault("s", "");
                Map<String, Object> result = new LinkedHashMap<>();
                result.put("code", 200);
                result.put("op", op);
                result.put("input", s);
                switch (op) {
                    case "isEmpty": result.put("result", stringUtils.isEmpty(s)); break;
                    case "isBlank": result.put("result", stringUtils.isBlank(s)); break;
                    case "reverse": result.put("result", stringUtils.reverse(s)); break;
                    case "toCamelCase": result.put("result", stringUtils.toCamelCase(s)); break;
                    case "isPalindrome": result.put("result", stringUtils.isPalindrome(s)); break;
                    case "count": {
                        String sub = p.getOrDefault("sub", "");
                        result.put("sub", sub);
                        result.put("result", stringUtils.countOccurrences(s, sub));
                        break;
                    }
                    default:
                        sendJson(ex, 400, error(400, "未知操作: " + op));
                        return;
                }
                sendJson(ex, 200, result);
            } catch (Exception e) {
                sendJson(ex, 500, error(500, e.getMessage()));
            }
        }
    }

    // ====== 用户校验 API ======
    class UserHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            try {
                Map<String, String> p = parseQuery(ex.getRequestURI().getQuery());
                String op = p.getOrDefault("op", "");
                Map<String, Object> result = new LinkedHashMap<>();
                result.put("code", 200);
                result.put("op", op);
                switch (op) {
                    case "username": result.put("result", userValidator.isValidUsername(p.get("v"))); break;
                    case "password": result.put("result", userValidator.isValidPassword(p.get("v"))); break;
                    case "email": result.put("result", userValidator.isValidEmail(p.get("v"))); break;
                    case "validate":
                        result.put("result", userValidator.validateUser(
                                p.get("u"), p.get("p"), p.get("e"))); break;
                    case "permission": result.put("result", userValidator.checkPermission(p.get("role"))); break;
                    default:
                        sendJson(ex, 400, error(400, "未知操作: " + op));
                        return;
                }
                sendJson(ex, 200, result);
            } catch (IllegalArgumentException e) {
                sendJson(ex, 400, error(400, e.getMessage()));
            } catch (Exception e) {
                sendJson(ex, 500, error(500, e.getMessage()));
            }
        }
    }

    // ====== 测试执行 API ======
    class TestRunHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            try {
                Map<String, String> p = parseQuery(ex.getRequestURI().getQuery());
                String target = p.getOrDefault("target", "all");

                SummaryGeneratingListener listener = new SummaryGeneratingListener();
                LauncherDiscoveryRequestBuilder builder = LauncherDiscoveryRequestBuilder.request();

                switch (target) {
                    case "calculator":
                        builder.selectors(DiscoverySelectors.selectClass(
                                "com.example.utils.CalculatorTest"));
                        break;
                    case "string":
                        builder.selectors(DiscoverySelectors.selectClass(
                                "com.example.utils.StringUtilsTest"));
                        break;
                    case "user":
                        builder.selectors(DiscoverySelectors.selectClass(
                                "com.example.utils.UserValidatorTest"));
                        break;
                    case "api":
                        builder.selectors(DiscoverySelectors.selectClass(
                                "com.example.api.UserApiTest"));
                        break;
                    case "restassured":
                        builder.selectors(DiscoverySelectors.selectClass(
                                "com.example.api.UserApiRestAssuredTest"));
                        break;
                    case "ui":
                        builder.selectors(DiscoverySelectors.selectClass(
                                "com.example.ui.WebUiTest"));
                        break;
                    case "suite":
                        builder.selectors(DiscoverySelectors.selectClass(
                                "com.example.automation.AutomationTestSuite"));
                        break;
                    default: // all
                        builder.selectors(DiscoverySelectors.selectPackage("com.example"));
                }

                LauncherDiscoveryRequest request = builder.build();
                Launcher launcher = LauncherFactory.create();
                launcher.registerTestExecutionListeners(listener);
                launcher.execute(request);

                TestExecutionSummary summary = listener.getSummary();

                List<Map<String, Object>> failures = new ArrayList<>();
                for (TestExecutionSummary.Failure f : summary.getFailures()) {
                    Map<String, Object> fm = new LinkedHashMap<>();
                    fm.put("displayName", f.getTestIdentifier().getDisplayName());
                    fm.put("className", f.getTestIdentifier().getLegacyReportingName());
                    Throwable t = f.getException();
                    fm.put("message", t == null ? "" : t.getMessage());
                    fm.put("type", t == null ? "" : t.getClass().getSimpleName());
                    failures.add(fm);
                }

                Map<String, Object> result = new LinkedHashMap<>();
                result.put("code", 200);
                result.put("target", target);
                result.put("total", summary.getTestsFoundCount());
                result.put("success", summary.getTestsSucceededCount());
                result.put("failed", summary.getTestsFailedCount());
                result.put("skipped", summary.getTestsSkippedCount());
                result.put("aborted", summary.getTestsAbortedCount());
                // getTimeStarted / getTimeFinished 返回 long (epoch ms)
                long started = summary.getTimeStarted();
                long finished = summary.getTimeFinished();
                result.put("time", String.format("%.3f", (finished - started) / 1000.0));
                result.put("failures", failures);
                sendJson(ex, 200, result);
            } catch (Exception e) {
                sendJson(ex, 500, error(500, "测试执行失败: " + e.getMessage()));
            }
        }
    }

    // ====== 性能测试 API（模拟 JMeter 并发压测） ======
    class PerfHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            try {
                Map<String, String> p = parseQuery(ex.getRequestURI().getQuery());
                int threads = Integer.parseInt(p.getOrDefault("threads", "20"));
                int loops = Integer.parseInt(p.getOrDefault("loops", "20"));
                String api = p.getOrDefault("api", "calc");
                int targetPort = parseInt(System.getenv().getOrDefault("PORT", String.valueOf(PORT)));

                // 并发压测：多线程发送 HTTP 请求
                java.util.concurrent.CountDownLatch latch = new java.util.concurrent.CountDownLatch(threads);
                java.util.List<Long> elapsedList = java.util.Collections.synchronizedList(new ArrayList<>());
                java.util.concurrent.atomic.AtomicInteger success = new java.util.concurrent.atomic.AtomicInteger(0);
                java.util.concurrent.atomic.AtomicInteger failed = new java.util.concurrent.atomic.AtomicInteger(0);

                long startTime = System.currentTimeMillis();

                for (int i = 0; i < threads; i++) {
                    new Thread(() -> {
                        try {
                            for (int j = 0; j < loops; j++) {
                                long t0 = System.currentTimeMillis();
                                try {
                                    java.net.URL url;
                                    if ("login".equals(api)) {
                                        url = new java.net.URL("http://localhost:" + targetPort +
                                                "/api/login?username=admin&password=Admin123");
                                    } else {
                                        int a = (int) (Math.random() * 1000);
                                        int b = (int) (Math.random() * 1000);
                                        url = new java.net.URL("http://localhost:" + targetPort +
                                                "/api/calc?a=" + a + "&b=" + b + "&op=add");
                                    }
                                    java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                                    conn.setConnectTimeout(5000);
                                    conn.setReadTimeout(10000);
                                    int code = conn.getResponseCode();
                                    conn.disconnect();
                                    if (code == 200) success.incrementAndGet();
                                    else failed.incrementAndGet();
                                } catch (Exception e) {
                                    failed.incrementAndGet();
                                }
                                elapsedList.add(System.currentTimeMillis() - t0);
                            }
                        } finally {
                            latch.countDown();
                        }
                    }).start();
                }

                latch.await(60, java.util.concurrent.TimeUnit.SECONDS);
                long totalTime = System.currentTimeMillis() - startTime;

                // 统计
                java.util.Collections.sort(elapsedList);
                int total = threads * loops;
                double avg = elapsedList.stream().mapToLong(l -> l).average().orElse(0);
                long min = elapsedList.isEmpty() ? 0 : elapsedList.get(0);
                long max = elapsedList.isEmpty() ? 0 : elapsedList.get(elapsedList.size() - 1);
                long p90 = elapsedList.isEmpty() ? 0 : elapsedList.get((int) (elapsedList.size() * 0.9));
                long p95 = elapsedList.isEmpty() ? 0 : elapsedList.get((int) (elapsedList.size() * 0.95));
                double tps = totalTime > 0 ? (total * 1000.0 / totalTime) : 0;
                double errorRate = total > 0 ? (failed.get() * 100.0 / total) : 0;

                Map<String, Object> result = new LinkedHashMap<>();
                result.put("code", 200);
                result.put("api", "GET /api/" + api);
                result.put("threads", threads);
                result.put("loops", loops);
                result.put("totalRequests", total);
                result.put("success", success.get());
                result.put("failed", failed.get());
                result.put("errorRate", String.format("%.2f%%", errorRate));
                result.put("totalTime", totalTime + " ms");
                result.put("avgResponse", String.format("%.1f ms", avg));
                result.put("minResponse", min + " ms");
                result.put("maxResponse", max + " ms");
                result.put("p90", p90 + " ms");
                result.put("p95", p95 + " ms");
                result.put("tps", String.format("%.1f req/s", tps));
                sendJson(ex, 200, result);
            } catch (Exception e) {
                sendJson(ex, 500, error(500, "性能测试失败: " + e.getMessage()));
            }
        }
    }

    // ====== 复用 UserApi 的 Handler（简化版，直接调用 validator） ======
    class RegisterHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            try {
                if (!"POST".equalsIgnoreCase(ex.getRequestMethod())) {
                    sendJson(ex, 405, error(405, "方法不允许"));
                    return;
                }
                Map<String, String> p = parseQuery(ex.getRequestURI().getQuery());
                if (userValidator.validateUser(p.get("username"), p.get("password"), p.get("email"))) {
                    sendJson(ex, 200, success("注册成功"));
                } else {
                    sendJson(ex, 400, error(400, "注册信息不合法"));
                }
            } catch (Exception e) {
                sendJson(ex, 500, error(500, e.getMessage()));
            }
        }
    }

    class LoginHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            try {
                if (!"POST".equalsIgnoreCase(ex.getRequestMethod())) {
                    sendJson(ex, 405, error(405, "方法不允许"));
                    return;
                }
                Map<String, String> p = parseQuery(ex.getRequestURI().getQuery());
                if ("admin".equals(p.get("username")) && "Admin123".equals(p.get("password"))) {
                    Map<String, Object> r = success("登录成功");
                    r.put("token", "mock-token-" + System.currentTimeMillis());
                    sendJson(ex, 200, r);
                } else {
                    sendJson(ex, 401, error(401, "用户名或密码错误"));
                }
            } catch (Exception e) {
                sendJson(ex, 500, error(500, e.getMessage()));
            }
        }
    }

    class PermissionHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            try {
                Map<String, String> p = parseQuery(ex.getRequestURI().getQuery());
                String perm = userValidator.checkPermission(p.get("role"));
                Map<String, Object> r = success("ok");
                r.put("permission", perm);
                sendJson(ex, 200, r);
            } catch (IllegalArgumentException e) {
                sendJson(ex, 400, error(400, e.getMessage()));
            } catch (Exception e) {
                sendJson(ex, 500, error(500, e.getMessage()));
            }
        }
    }

    private Map<String, Object> success(String msg) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("code", 200);
        m.put("message", msg);
        return m;
    }

    private Map<String, Object> error(int code, String msg) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("code", code);
        m.put("message", msg);
        return m;
    }
}
