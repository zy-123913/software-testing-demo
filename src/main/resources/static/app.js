// ====== Tab 切换 ======
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
    });
});

// ====== 通用请求方法 ======
async function api(url, opts = {}) {
    try {
        const res = await fetch(url, opts);
        return await res.json();
    } catch (e) {
        return { code: 0, message: '请求失败: ' + e.message };
    }
}

function showResult(el, data, isOkFn) {
    el.classList.remove('ok', 'err');
    const ok = isOkFn ? isOkFn(data) : data && data.code === 200;
    el.classList.add(ok ? 'ok' : 'err');
    el.textContent = JSON.stringify(data, null, 2);
}

// ====== 计算器 ======
const $calcA = document.getElementById('calc-a');
const $calcB = document.getElementById('calc-b');
const $calcOp = document.getElementById('calc-op');
const $calcN = document.getElementById('calc-n');
const $calcRes = document.getElementById('calc-result');

document.getElementById('calc-run').addEventListener('click', async () => {
    const data = await api(`/api/calc?a=${$calcA.value}&b=${$calcB.value}&op=${$calcOp.value}`);
    showResult($calcRes, data);
});

document.querySelectorAll('[data-single]').forEach(btn => {
    btn.addEventListener('click', async () => {
        const op = btn.dataset.single;
        const data = await api(`/api/calc?a=${$calcN.value}&op=${op}`);
        showResult($calcRes, data);
    });
});

// ====== 字符串工具 ======
const $strS = document.getElementById('str-s');
const $strSub = document.getElementById('str-sub');
const $strRes = document.getElementById('str-result');

document.querySelectorAll('[data-sop]').forEach(btn => {
    btn.addEventListener('click', async () => {
        const op = btn.dataset.sop;
        let url = `/api/string?s=${encodeURIComponent($strS.value)}&op=${op}`;
        if (op === 'count') url += `&sub=${encodeURIComponent($strSub.value)}`;
        const data = await api(url);
        showResult($strRes, data);
    });
});

// ====== 用户校验 ======
const $uvUser = document.getElementById('uv-username');
const $uvPwd = document.getElementById('uv-password');
const $uvEmail = document.getElementById('uv-email');
const $uvRole = document.getElementById('uv-role');
const $uvRes = document.getElementById('user-result');

document.getElementById('uv-validate').addEventListener('click', async () => {
    const url = `/api/user?op=validate&u=${encodeURIComponent($uvUser.value)}`
        + `&p=${encodeURIComponent($uvPwd.value)}&e=${encodeURIComponent($uvEmail.value)}`;
    const data = await api(url);
    showResult($uvRes, data);
});

document.getElementById('uv-permission').addEventListener('click', async () => {
    const data = await api(`/api/user?op=permission&role=${encodeURIComponent($uvRole.value)}`);
    showResult($uvRes, data);
});

// ====== 接口测试 ======
document.getElementById('reg-run').addEventListener('click', async () => {
    const q = `username=${encodeURIComponent(document.getElementById('reg-u').value)}`
        + `&password=${encodeURIComponent(document.getElementById('reg-p').value)}`
        + `&email=${encodeURIComponent(document.getElementById('reg-e').value)}`;
    const data = await api(`/api/register?${q}`, { method: 'POST' });
    showResult(document.getElementById('reg-result'), data);
});

document.getElementById('login-run').addEventListener('click', async () => {
    const q = `username=${encodeURIComponent(document.getElementById('login-u').value)}`
        + `&password=${encodeURIComponent(document.getElementById('login-p').value)}`;
    const data = await api(`/api/login?${q}`, { method: 'POST' });
    showResult(document.getElementById('login-result'), data);
});

document.getElementById('perm-run').addEventListener('click', async () => {
    const data = await api(`/api/permission?role=${encodeURIComponent(document.getElementById('perm-r').value)}`);
    showResult(document.getElementById('perm-result'), data);
});

// ====== 运行测试 ======
const $summary = document.getElementById('test-summary');
const $failures = document.getElementById('test-failures');
const $log = document.getElementById('test-log');

function logLine(text, cls) {
    const line = document.createElement('div');
    if (cls) line.className = 'log-' + cls;
    const t = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    line.textContent = `[${t}] ${text}`;
    $log.appendChild(line);
    $log.scrollTop = $log.scrollHeight;
}

document.querySelectorAll('.test-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const target = btn.dataset.target;
        document.querySelectorAll('.test-btn').forEach(b => b.disabled = true);
        $log.classList.add('show');
        $log.innerHTML = '';
        $summary.classList.remove('show', 'ok', 'fail');
        $failures.innerHTML = '';

        const names = {
            all: '全部测试', calculator: '计算器单元测试', string: '字符串单元测试',
            user: '用户校验单元测试', api: 'HTTP 接口测试',
            restassured: 'RestAssured API 自动化测试',
            ui: 'Playwright UI 自动化测试',
            suite: '自动化测试套件'
        };
        logLine(`▶ 开始执行：${names[target]}`, 'info');
        logLine(`  目标：target=${target}`, 'info');

        const start = Date.now();
        const data = await api(`/api/test/run?target=${target}`);
        const cost = ((Date.now() - start) / 1000).toFixed(2);

        if (!data || data.code !== 200) {
            logLine(`✖ 执行失败：${JSON.stringify(data)}`, 'err');
            document.querySelectorAll('.test-btn').forEach(b => b.disabled = false);
            return;
        }

        logLine(`✔ 执行完成，耗时 ${cost} 秒`, data.failed > 0 ? 'warn' : 'ok');
        logLine(`  总计: ${data.total}  成功: ${data.success}  失败: ${data.failed}  跳过: ${data.skipped}  异常中断: ${data.aborted}`, 'info');

        // 摘要卡片
        $summary.innerHTML = `
            <div class="stat"><span class="num">${data.total}</span><span class="label">总用例数</span></div>
            <div class="stat"><span class="num" style="color:#86efac">${data.success}</span><span class="label">成功</span></div>
            <div class="stat"><span class="num" style="color:#fca5a5">${data.failed}</span><span class="label">失败</span></div>
            <div class="stat"><span class="num" style="color:#fcd34d">${data.skipped}</span><span class="label">跳过</span></div>
            <div class="stat"><span class="num" style="color:#93c5fd">${data.time}s</span><span class="label">执行耗时</span></div>
        `;
        $summary.classList.add('show');
        $summary.classList.add(data.failed === 0 ? 'ok' : 'fail');

        // 失败详情
        if (data.failures && data.failures.length) {
            $failures.innerHTML = `<h3 style="color:#dc2626;margin-bottom:12px;">❌ 失败详情 (${data.failures.length})</h3>`;
            data.failures.forEach(f => {
                const card = document.createElement('div');
                card.className = 'failure-card';
                card.innerHTML = `
                    <div class="fc-title">${f.displayName}</div>
                    <div class="fc-type">${f.className} · ${f.type}</div>
                    <div class="fc-msg">${f.message || '(无错误信息)'}</div>
                `;
                $failures.appendChild(card);
                logLine(`✖ ${f.displayName}: ${f.message}`, 'err');
            });
        } else {
            logLine(`🎉 所有测试全部通过！`, 'ok');
        }

        document.querySelectorAll('.test-btn').forEach(b => b.disabled = false);
    });
});

// ====== 性能测试 ======
const $perfSummary = document.getElementById('perf-summary');
const $perfDetail = document.getElementById('perf-detail');
const $perfRun = document.getElementById('perf-run');

$perfRun.addEventListener('click', async () => {
    const apiName = document.getElementById('perf-api').value;
    const threads = document.getElementById('perf-threads').value;
    const loops = document.getElementById('perf-loops').value;

    $perfRun.disabled = true;
    $perfRun.textContent = '⏳ 压测进行中...';
    $perfSummary.classList.remove('show', 'ok', 'fail');
    $perfDetail.style.display = 'none';

    const total = threads * loops;
    const start = Date.now();
    const data = await api(`/api/test/perf?api=${apiName}&threads=${threads}&loops=${loops}`);
    const cost = ((Date.now() - start) / 1000).toFixed(2);

    if (!data || data.code !== 200) {
        $perfDetail.style.display = 'block';
        $perfDetail.className = 'result err';
        $perfDetail.textContent = '压测失败: ' + JSON.stringify(data);
        $perfRun.disabled = false;
        $perfRun.textContent = '▶ 开始压测';
        return;
    }

    const allOk = data.failed === 0;
    $perfSummary.innerHTML = `
        <div class="stat"><span class="num">${data.totalRequests}</span><span class="label">总请求数</span></div>
        <div class="stat"><span class="num" style="color:#86efac">${data.success}</span><span class="label">成功</span></div>
        <div class="stat"><span class="num" style="color:#fca5a5">${data.failed}</span><span class="label">失败</span></div>
        <div class="stat"><span class="num" style="color:#fcd34d">${data.errorRate}</span><span class="label">错误率</span></div>
        <div class="stat"><span class="num" style="color:#93c5fd">${data.tps}</span><span class="label">吞吐量(TPS)</span></div>
        <div class="stat"><span class="num" style="color:#c4b5fd">${data.avgResponse}</span><span class="label">平均响应</span></div>
        <div class="stat"><span class="num" style="color:#f0abfc">${data.p95}</span><span class="label">P95 响应</span></div>
        <div class="stat"><span class="num" style="color:#67e8f9">${data.totalTime}</span><span class="label">总耗时</span></div>
    `;
    $perfSummary.classList.add('show');
    $perfSummary.classList.add(allOk ? 'ok' : 'fail');

    $perfDetail.style.display = 'block';
    $perfDetail.className = 'result ' + (allOk ? 'ok' : 'err');
    $perfDetail.textContent =
        `性能测试报告\n` +
        `═══════════════════════════════════════\n` +
        `目标接口:   ${data.api}\n` +
        `并发线程:   ${data.threads}\n` +
        `循环次数:   ${data.loops}\n` +
        `───────────────────────────────────────\n` +
        `总请求数:   ${data.totalRequests}\n` +
        `成功请求:   ${data.success}\n` +
        `失败请求:   ${data.failed}\n` +
        `错误率:     ${data.errorRate}\n` +
        `───────────────────────────────────────\n` +
        `总耗时:     ${data.totalTime}\n` +
        `平均响应:   ${data.avgResponse}\n` +
        `最小响应:   ${data.minResponse}\n` +
        `最大响应:   ${data.maxResponse}\n` +
        `P90 响应:   ${data.p90}\n` +
        `P95 响应:   ${data.p95}\n` +
        `吞吐量 TPS: ${data.tps}\n` +
        `═══════════════════════════════════════\n` +
        `结论: ${allOk ? '✔ 所有请求成功，系统性能良好' : '⚠ 存在失败请求，需排查'}`;

    $perfRun.disabled = false;
    $perfRun.textContent = '▶ 开始压测';
});
