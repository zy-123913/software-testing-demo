package com.example.extension;

import com.example.web.WebApplication;
import org.junit.jupiter.api.extension.AfterAllCallback;
import org.junit.jupiter.api.extension.BeforeAllCallback;
import org.junit.jupiter.api.extension.ExtensionContext;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * JUnit 5 扩展：在测试类启动前启动 WebApplication，全部测试结束后停止。
 * 使用引用计数支持多个测试类共享同一个服务实例。
 *
 * 使用方式：
 *   @RegisterExtension
 *   static final WebServerExtension server = new WebServerExtension(); // 0 = 随机端口，避免冲突
 *
 *   然后在测试中通过 server.getBaseUrl() 获取访问地址，或 server.getPort() 拿到实际端口。
 */
public class WebServerExtension implements BeforeAllCallback, AfterAllCallback {

    private static final AtomicInteger REF_COUNT = new AtomicInteger(0);
    private static WebApplication app;
    private static String baseUrl;
    private static int actualPort;

    private final int requestedPort;

    public WebServerExtension() {
        this(0); // 默认 0 = 动态分配随机空闲端口
    }

    public WebServerExtension(int port) {
        this.requestedPort = port;
    }

    @Override
    public synchronized void beforeAll(ExtensionContext context) throws Exception {
        if (REF_COUNT.getAndIncrement() == 0) {
            app = new WebApplication();
            int bound = app.start(requestedPort);
            actualPort = (bound > 0) ? bound : requestedPort;
            baseUrl = "http://localhost:" + actualPort;
            // 等待服务就绪
            Thread.sleep(300);
            System.out.println("[WebServerExtension] 服务已启动: " + baseUrl);
        }
    }

    @Override
    public synchronized void afterAll(ExtensionContext context) {
        if (REF_COUNT.decrementAndGet() == 0 && app != null) {
            app.stop();
            app = null;
            System.out.println("[WebServerExtension] 服务已停止");
        }
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public int getPort() {
        return actualPort;
    }
}
