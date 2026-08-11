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

// 金额：分 -> 元
function fen2yuan(fen) {
    if (fen == null) return '-';
    return (fen / 100).toFixed(2);
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

// ============================================================
// ====== 电商业务：用户管理 / 商品管理 / 订单交易 ============
// ============================================================

// 通用：表格渲染
function renderTable(tbodySelector, rows, columns) {
    const tbody = document.querySelector(tbodySelector);
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!rows || rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${columns.length}" style="text-align:center;color:#999;padding:24px;">暂无数据，点击「初始化演示数据」或添加记录</td></tr>`;
        return;
    }
    rows.forEach(row => {
        const tr = document.createElement('tr');
        columns.forEach(col => {
            const td = document.createElement('td');
            td.innerHTML = typeof col.render === 'function' ? col.render(row) : (row[col.key] ?? '-');
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

// ---- 初始化演示数据 ----
document.getElementById('biz-init').addEventListener('click', async () => {
    const data = await api('/biz/init');
    showResult(document.getElementById('bizuser-register-result'), data);
    if (data.code === 200) {
        await Promise.all([loadUserList(), loadProductList(), loadOrderList()]);
    }
});

// ---- 用户管理 ----
async function loadUserList() {
    const data = await api('/biz/user/list');
    const list = (data && data.code === 200 && data.data) ? data.data : [];
    document.getElementById('bizuser-count').textContent = `用户数: ${list.length}`;
    // 把第一个卖家ID填入商品上架表单
    const seller = list.find(u => u.role === 'SELLER');
    if (seller && !document.getElementById('bizprod-seller').value) {
        document.getElementById('bizprod-seller').value = seller.id;
    }
    // 把第一个买家ID填入订单表单
    const buyer = list.find(u => u.role === 'BUYER');
    if (buyer && !document.getElementById('bizorder-buyer').value) {
        document.getElementById('bizorder-buyer').value = buyer.id;
    }
    if (!document.getElementById('bizuser-recharge-id').value && buyer) {
        document.getElementById('bizuser-recharge-id').value = buyer.id;
    }
    if (!document.getElementById('txlog-userid').value && buyer) {
        document.getElementById('txlog-userid').value = buyer.id;
    }
    renderTable('#bizuser-table tbody', list, [
        { key: 'id' },
        { key: 'username' },
        { key: 'email' },
        { render: r => `<span class="status-tag role-${r.role}">${r.role}</span>` },
        { render: r => `<b>¥${fen2yuan(r.balance)}</b>` },
        { key: 'createdAt' }
    ]);
    return list;
}
document.getElementById('bizuser-refresh').addEventListener('click', loadUserList);

document.getElementById('bizuser-register').addEventListener('click', async () => {
    const qs = new URLSearchParams({
        username: document.getElementById('bizuser-username').value,
        password: document.getElementById('bizuser-password').value,
        email: document.getElementById('bizuser-email').value,
        role: document.getElementById('bizuser-role').value
    }).toString();
    const data = await api(`/biz/user/register?${qs}`, { method: 'POST' });
    showResult(document.getElementById('bizuser-register-result'), data);
    if (data.code === 200) await loadUserList();
});

document.getElementById('bizuser-login').addEventListener('click', async () => {
    const qs = new URLSearchParams({
        username: document.getElementById('bizuser-login-u').value,
        password: document.getElementById('bizuser-login-p').value
    }).toString();
    const data = await api(`/biz/user/login?${qs}`, { method: 'POST' });
    showResult(document.getElementById('bizuser-login-result'), data);
});

document.getElementById('bizuser-recharge').addEventListener('click', async () => {
    const id = document.getElementById('bizuser-recharge-id').value;
    const amount = parseInt(document.getElementById('bizuser-recharge-amount').value || '0', 10);
    const qs = `userId=${id}&amount=${amount * 100}`; // 元转分
    const data = await api(`/biz/user/recharge?${qs}`, { method: 'POST' });
    showResult(document.getElementById('bizuser-recharge-result'), data);
    if (data.code === 200) await loadUserList();
});

// ---- 账户交易流水 ----
document.getElementById('txlog-query').addEventListener('click', async () => {
    const uid = document.getElementById('txlog-userid').value;
    if (!uid) {
        const el = document.getElementById('txlog-result');
        el.classList.remove('ok'); el.classList.add('err');
        el.textContent = '请先输入用户ID';
        return;
    }
    const data = await api(`/biz/user/transactions?userId=${uid}`);
    showResult(document.getElementById('txlog-result'), data);
    const list = (data && data.code === 200 && data.data) ? data.data : [];
    document.getElementById('txlog-count').textContent = `共 ${list.length} 条`;
    renderTable('#txlog-table tbody', list, [
        { key: 'id' },
        { render: r => `<span class="status-tag tx-${r.type}">${r.type || '-'}</span>` },
        { render: r => {
            const a = r.amount || 0;
            return `<b style="color:${a >= 0 ? '#059669' : '#dc2626'}">${a >= 0 ? '+' : ''}${fen2yuan(a)}</b>`;
        }},
        { render: r => `<b>¥${fen2yuan(r.balanceAfter)}</b>` },
        { key: 'refNo', render: r => r.refNo || '-' },
        { key: 'remark', render: r => r.remark || '-' },
        { key: 'createdAt' }
    ]);
});

// ---- 商品管理 ----
async function loadProductList(category) {
    const url = category
        ? `/biz/product/list?category=${encodeURIComponent(category)}`
        : `/biz/product/list`;
    const data = await api(url);
    const list = (data && data.code === 200 && data.data) ? data.data : [];
    document.getElementById('bizprod-count').textContent = `商品数: ${list.length}`;
    // 把第一个商品ID填入订单表单
    if (list.length && !document.getElementById('bizorder-product').value) {
        document.getElementById('bizorder-product').value = list[0].id;
    }
    renderTable('#bizprod-table tbody', list, [
        { key: 'id' },
        { key: 'name' },
        { key: 'category' },
        { render: r => `<b>¥${fen2yuan(r.price)}</b>` },
        { render: r => {
            const s = r.stock || 0;
            const cls = s === 0 ? 'color:#dc2626;font-weight:700' : (s < 10 ? 'color:#d97706;font-weight:700' : '');
            return `<span style="${cls}">${s}</span>`;
        }},
        { key: 'sellerId' },
        { render: r => `<span class="status-tag status-${r.status}">${r.status}</span>` }
    ]);
    return list;
}
document.getElementById('bizprod-refresh').addEventListener('click', () => loadProductList());
document.getElementById('bizprod-filter-btn').addEventListener('click', () => {
    loadProductList(document.getElementById('bizprod-category-filter').value);
});

document.getElementById('bizprod-create').addEventListener('click', async () => {
    const name = document.getElementById('bizprod-name').value;
    const price = parseInt(document.getElementById('bizprod-price').value || '0', 10) * 100;
    const stock = parseInt(document.getElementById('bizprod-stock').value || '0', 10);
    const category = document.getElementById('bizprod-category').value;
    const sellerId = document.getElementById('bizprod-seller').value;
    const qs = new URLSearchParams({ name, price, stock, category, sellerId }).toString();
    const data = await api(`/biz/product/create?${qs}`, { method: 'POST' });
    showResult(document.getElementById('bizprod-create-result'), data);
    if (data.code === 200) await loadProductList();
});

// ---- 商品搜索分页 ----
document.getElementById('prodsearch-btn').addEventListener('click', async () => {
    const qs = new URLSearchParams({
        keyword: document.getElementById('prodsearch-kw').value || '',
        category: document.getElementById('prodsearch-cat').value || '',
        page: document.getElementById('prodsearch-page').value || '1',
        size: document.getElementById('prodsearch-size').value || '10'
    }).toString();
    const data = await api(`/biz/product/search?${qs}`);
    showResult(document.getElementById('prodsearch-result'), data);
    const ok = data && data.code === 200 && data.data;
    const list = ok ? data.data.list || [] : [];
    const total = ok ? (data.data.total || 0) : 0;
    const page = ok ? (data.data.page || 1) : 1;
    const tp = ok ? (data.data.totalPages || 0) : 0;
    document.getElementById('prodsearch-info').textContent = `共 ${total} 条 / 第 ${page} 页 / 共 ${tp} 页`;
    renderTable('#prodsearch-table tbody', list, [
        { key: 'id' },
        { key: 'name' },
        { key: 'category' },
        { render: r => `<b>¥${fen2yuan(r.price)}</b>` },
        { render: r => {
            const s = r.stock || 0;
            const cls = s === 0 ? 'color:#dc2626;font-weight:700' : (s < 10 ? 'color:#d97706;font-weight:700' : '');
            return `<span style="${cls}">${s}</span>`;
        }},
        { key: 'sellerId' },
        { render: r => `<span class="status-tag status-${r.status}">${r.status}</span>` }
    ]);
});

// ---- 订单交易 ----
async function loadOrderList(status) {
    const url = status
        ? `/biz/order/list?status=${encodeURIComponent(status)}`
        : `/biz/order/list`;
    const data = await api(url);
    const list = (data && data.code === 200 && data.data) ? data.data : [];
    const totalAmount = list.reduce((s, o) => s + (o.status === 'COMPLETED' ? (o.totalAmount || 0) : 0), 0);
    document.getElementById('bizorder-count').textContent = `订单数: ${list.length}`;
    document.getElementById('bizorder-amount').textContent = `总成交额: ¥${fen2yuan(totalAmount)}`;
    renderTable('#bizorder-table tbody', list, [
        { key: 'id' },
        { key: 'buyerId' },
        { key: 'productId' },
        { key: 'quantity' },
        { render: r => `<b>¥${fen2yuan(r.totalAmount)}</b>` },
        { render: r => `<span class="status-tag status-${r.status}">${r.status}</span>` },
        { key: 'address' },
        { render: r => r.refundedAt ? r.refundedAt : '-' },
        { key: 'createdAt' }
    ]);
    return list;
}
document.getElementById('bizorder-refresh').addEventListener('click', () => loadOrderList());
document.getElementById('bizorder-filter-btn').addEventListener('click', () => {
    loadOrderList(document.getElementById('bizorder-status-filter').value);
});

document.getElementById('bizorder-create').addEventListener('click', async () => {
    const qs = new URLSearchParams({
        buyerId: document.getElementById('bizorder-buyer').value,
        productId: document.getElementById('bizorder-product').value,
        quantity: document.getElementById('bizorder-quantity').value,
        address: document.getElementById('bizorder-address').value
    }).toString();
    const data = await api(`/biz/order/create?${qs}`, { method: 'POST' });
    showResult(document.getElementById('bizorder-create-result'), data);
    if (data.code === 200) {
        await Promise.all([loadOrderList(), loadUserList(), loadProductList()]);
    }
});

document.querySelectorAll('[data-orderaction]').forEach(btn => {
    btn.addEventListener('click', async () => {
        const action = btn.dataset.orderaction;
        const orderId = document.getElementById('bizorder-action-id').value;
        const opId = document.getElementById('bizorder-action-opid').value;
        let qs;
        if (action === 'ship') qs = `orderId=${orderId}&sellerId=${opId}`;
        else if (action === 'complete') qs = `orderId=${orderId}&buyerId=${opId}`;
        else qs = `orderId=${orderId}&operatorId=${opId}`;
        const data = await api(`/biz/order/${action}?${qs}`, { method: 'POST' });
        showResult(document.getElementById('bizorder-action-result'), data);
        if (data.code === 200) await loadOrderList();
    });
});

// 页面加载时自动尝试初始化并加载列表（不阻塞）
window.addEventListener('DOMContentLoaded', async () => {
    try {
        await api('/biz/init');
        await Promise.all([loadUserList(), loadProductList(), loadOrderList()]);
    } catch (e) { /* ignore */ }
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
            biz: '电商业务 Service 单元测试',
            bizapi: '电商业务 RestAssured API 集成测试',
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
