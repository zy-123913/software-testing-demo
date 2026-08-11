# JMeter 性能测试

本目录包含对软件测试演示平台的 JMeter 性能测试脚本。

## 测试场景

| 场景 | 接口 | 并发数 | 循环次数 | 总请求数 |
|---|---|---|---|---|
| 计算器接口压测 | GET /api/calc (随机参数) | 50 | 100 | 5000 |
| 登录接口压测 | POST /api/login | 30 | 100 | 3000 |

## 使用方法

### 1. 安装 JMeter

从官网下载 [Apache JMeter 5.6+](https://jmeter.apache.org/download_jmeter.cgi)，解压后设置环境变量：

```bash
set JMETER_HOME=D:\apache-jmeter-5.6.3
```

### 2. 启动被测服务

```bash
mvn exec:java "-Dfile.encoding=UTF-8"
```

### 3. 运行性能测试

**方式 A：双击运行**
直接双击 `run.bat`

**方式 B：命令行运行**
```bash
%JMETER_HOME%\bin\jmeter -n -t SoftwareTestingDemo.jmx -l results/result.jtl -e -o results/html
```

### 4. 查看报告

测试完成后会在 `results/` 目录生成：
- `result_YYYYMMDD_HHMMSS.jtl`：原始结果数据
- `html_YYYYMMDD_HHMMSS/index.html`：HTML 可视化报告

用浏览器打开 `index.html` 即可查看：
- 响应时间（平均/最小/最大/P90/P95/P99）
- 吞吐量（TPS）
- 错误率
- 响应时间分布图、趋势图

## 关键指标参考

| 指标 | 期望值 | 说明 |
|---|---|---|
| 平均响应时间 | < 50ms | 本地测试应极快 |
| P95 响应时间 | < 100ms | 95% 请求应在 100ms 内完成 |
| 错误率 | 0% | 所有断言应通过 |
| 吞吐量 | > 500/sec | 取决于机器性能 |

## 自定义参数

可在 JMeter GUI 中打开 `.jmx` 文件修改：
- 线程数（并发用户数）
- Ramp-up 时间
- 循环次数
- 目标主机和端口
