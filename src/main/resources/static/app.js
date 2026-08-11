// ====== Tab 切换 ======
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
    });
});

// ====== 安全工具：元素不存在时不报错，避免单个缺失元素导致全局脚本中断 ======
function $(id) { return document.getElementById(id); }
function bindClick(id, handler) {
    const el = typeof id === 'string' ? $(id) : id;
    if (!el) return;
    el.addEventListener('click', handler);
}
function bindAll(selector, handler) {
    document.querySelectorAll(selector).forEach(el => el && el.addEventListener('click', handler));
}

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

bindAll('[data-single]', async (e) => {
    const op = e.currentTarget.dataset.single;
    const data = await api(`/api/calc?a=${$calcN.value}&op=${op}`);
    showResult($calcRes, data);
});

// ====== 字符串工具 ======
const $strS = document.getElementById('str-s');
const $strSub = document.getElementById('str-sub');
const $strRes = document.getElementById('str-result');

bindAll('[data-sop]', async (e) => {
    const btn = e.currentTarget;
    const op = btn.dataset.sop;
    let url = `/api/string?s=${encodeURIComponent($strS.value)}&op=${op}`;
    if (op === 'count') url += `&sub=${encodeURIComponent($strSub.value)}`;
    const data = await api(url);
    showResult($strRes, data);
});

// ====== 用户校验 ======
const $uvUser = $('uv-username');
const $uvPwd = $('uv-password');
const $uvEmail = $('uv-email');
const $uvRole = $('uv-role');
const $uvRes = $('user-result');

bindClick('uv-validate', async () => {
    if (!$uvUser || !$uvPwd || !$uvEmail || !$uvRes) return;
    const url = `/api/user?op=validate&u=${encodeURIComponent($uvUser.value)}`
        + `&p=${encodeURIComponent($uvPwd.value)}&e=${encodeURIComponent($uvEmail.value)}`;
    const data = await api(url);
    showResult($uvRes, data);
});

bindClick('uv-permission', async () => {
    if (!$uvRole || !$uvRes) return;
    const data = await api(`/api/user?op=permission&role=${encodeURIComponent($uvRole.value)}`);
    showResult($uvRes, data);
});

// ====== 接口测试 ======
bindClick('reg-run', async () => {
    const regU = $('reg-u'), regP = $('reg-p'), regE = $('reg-e');
    const regResult = $('reg-result');
    if (!regU || !regP || !regE || !regResult) return;
    const q = `username=${encodeURIComponent(regU.value)}`
        + `&password=${encodeURIComponent(regP.value)}`
        + `&email=${encodeURIComponent(regE.value)}`;
    const data = await api(`/api/register?${q}`, { method: 'POST' });
    showResult(regResult, data);
    // 注册成功后同步刷新电商用户列表，使用户在两个tab中注册都能看到结果
    if (data && data.code === 200) {
        try { await loadUserList(); } catch (e) { /* ignore */ }
    }
});

bindClick('login-run', async () => {
    const loginU = $('login-u'), loginP = $('login-p'), loginResult = $('login-result');
    if (!loginU || !loginP || !loginResult) return;
    const q = `username=${encodeURIComponent(loginU.value)}`
        + `&password=${encodeURIComponent(loginP.value)}`;
    const data = await api(`/api/login?${q}`, { method: 'POST' });
    showResult(loginResult, data);
});

bindClick('perm-run', async () => {
    const permR = $('perm-r'), permResult = $('perm-result');
    if (!permR || !permResult) return;
    const data = await api(`/api/permission?role=${encodeURIComponent(permR.value)}`);
    showResult(permResult, data);
});

// ============================================================
// ====== 电商业务：用户管理 / 商品管理 / 订单交易 ============
// ============================================================

// 通用：表格渲染（带防御性空值检查）
function renderTable(tbodySelector, rows, columns) {
    try {
        const tbody = document.querySelector(tbodySelector);
        if (!tbody) return;
        tbody.innerHTML = '';
        const safeCols = Array.isArray(columns) ? columns : [];
        const safeRows = Array.isArray(rows) ? rows : [];
        if (safeRows.length === 0) {
            const colCount = Math.max(1, safeCols.length);
            tbody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center;color:#999;padding:24px;">暂无数据，点击「初始化演示数据」或添加记录</td></tr>`;
            return;
        }
        safeRows.forEach(row => {
            const tr = document.createElement('tr');
            safeCols.forEach(col => {
                const td = document.createElement('td');
                try {
                    td.innerHTML = typeof col.render === 'function' ? col.render(row) : ((row && row[col.key] != null) ? row[col.key] : '-');
                } catch (e) {
                    td.textContent = '-';
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('[renderTable] error:', e);
    }
}

// ---- 初始化演示数据 ----
bindClick('biz-init', async () => {
    const resultEl = $('bizuser-register-result');
    const data = await api('/biz/init');
    if (resultEl) showResult(resultEl, data);
    if (data.code === 200) {
        await Promise.all([loadUserList(), loadProductList(), loadOrderList()]);
    }
});

// ---- 用户管理 ----
async function loadUserList() {
    try {
        const data = await api('/biz/user/list');
        const list = (data && data.code === 200 && data.data) ? data.data : [];
        const countEl = $('bizuser-count');
        if (countEl) countEl.textContent = `用户数: ${list.length}`;
        // 把第一个卖家ID填入商品上架表单
        const seller = list.find(u => u && u.role === 'SELLER');
        const sellerInput = $('bizprod-seller');
        if (seller && sellerInput && !sellerInput.value) {
            sellerInput.value = seller.id;
        }
        // 把第一个买家ID填入订单表单
        const buyer = list.find(u => u && u.role === 'BUYER');
        const buyerInput = $('bizorder-buyer');
        if (buyer && buyerInput && !buyerInput.value) {
            buyerInput.value = buyer.id;
        }
        const rechargeInput = $('bizuser-recharge-id');
        if (rechargeInput && !rechargeInput.value && buyer) {
            rechargeInput.value = buyer.id;
        }
        const txlogInput = $('txlog-userid');
        if (txlogInput && !txlogInput.value && buyer) {
            txlogInput.value = buyer.id;
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
    } catch (e) {
        console.error('[loadUserList] error:', e);
        return [];
    }
}
bindClick('bizuser-refresh', loadUserList);

bindClick('bizuser-register', async () => {
    const uEl = $('bizuser-username'), pEl = $('bizuser-password');
    const eEl = $('bizuser-email'), rEl = $('bizuser-role');
    const resultEl = $('bizuser-register-result');
    if (!uEl || !pEl || !eEl || !rEl) return;
    const qs = new URLSearchParams({
        username: uEl.value,
        password: pEl.value,
        email: eEl.value,
        role: rEl.value
    }).toString();
    const data = await api(`/biz/user/register?${qs}`, { method: 'POST' });
    if (resultEl) showResult(resultEl, data);
    if (data.code === 200) await loadUserList();
});

bindClick('bizuser-login', async () => {
    const uEl = $('bizuser-login-u'), pEl = $('bizuser-login-p');
    const resultEl = $('bizuser-login-result');
    if (!uEl || !pEl) return;
    const qs = new URLSearchParams({
        username: uEl.value,
        password: pEl.value
    }).toString();
    const data = await api(`/biz/user/login?${qs}`, { method: 'POST' });
    if (resultEl) showResult(resultEl, data);
});

bindClick('bizuser-recharge', async () => {
    const idEl = $('bizuser-recharge-id');
    const amountEl = $('bizuser-recharge-amount');
    const resultEl = $('bizuser-recharge-result');
    if (!idEl || !amountEl) return;
    const id = idEl.value;
    const amount = parseInt(amountEl.value || '0', 10);
    const qs = `userId=${id}&amount=${amount * 100}`; // 元转分
    const data = await api(`/biz/user/recharge?${qs}`, { method: 'POST' });
    if (resultEl) showResult(resultEl, data);
    if (data.code === 200) await loadUserList();
});

// ---- 账户交易流水 ----
bindClick('txlog-query', async () => {
    const uidEl = $('txlog-userid');
    const resultEl = $('txlog-result');
    const countEl = $('txlog-count');
    if (!uidEl) return;
    const uid = uidEl.value;
    if (!uid) {
        const el = resultEl;
        if (el) {
            el.classList.remove('ok'); el.classList.add('err');
            el.textContent = '请先输入用户ID';
        }
        return;
    }
    const data = await api(`/biz/user/transactions?userId=${uid}`);
    if (resultEl) showResult(resultEl, data);
    const list = (data && data.code === 200 && data.data) ? data.data : [];
    if (countEl) countEl.textContent = `共 ${list.length} 条`;
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
bindClick('bizprod-refresh', () => loadProductList());
bindClick('bizprod-filter-btn', () => {
    const filterEl = $('bizprod-category-filter');
    loadProductList(filterEl ? filterEl.value : undefined);
});

bindClick('bizprod-create', async () => {
    const nameEl = $('bizprod-name');
    const priceEl = $('bizprod-price');
    const stockEl = $('bizprod-stock');
    const catEl = $('bizprod-category');
    const sellerEl = $('bizprod-seller');
    const resultEl = $('bizprod-create-result');
    if (!nameEl || !priceEl || !stockEl || !catEl || !sellerEl) return;
    const name = nameEl.value;
    const price = parseInt(priceEl.value || '0', 10) * 100;
    const stock = parseInt(stockEl.value || '0', 10);
    const category = catEl.value;
    const sellerId = sellerEl.value;
    const qs = new URLSearchParams({ name, price, stock, category, sellerId }).toString();
    const data = await api(`/biz/product/create?${qs}`, { method: 'POST' });
    if (resultEl) showResult(resultEl, data);
    if (data.code === 200) await loadProductList();
});

// ---- 商品搜索分页 ----
bindClick('prodsearch-btn', async () => {
    const kwEl = $('prodsearch-kw');
    const catEl = $('prodsearch-cat');
    const pageEl = $('prodsearch-page');
    const sizeEl = $('prodsearch-size');
    const resultEl = $('prodsearch-result');
    const infoEl = $('prodsearch-info');
    if (!kwEl || !catEl || !pageEl || !sizeEl) return;
    const qs = new URLSearchParams({
        keyword: kwEl.value || '',
        category: catEl.value || '',
        page: pageEl.value || '1',
        size: sizeEl.value || '10'
    }).toString();
    const data = await api(`/biz/product/search?${qs}`);
    if (resultEl) showResult(resultEl, data);
    const ok = data && data.code === 200 && data.data;
    const list = ok ? data.data.list || [] : [];
    const total = ok ? (data.data.total || 0) : 0;
    const page = ok ? (data.data.page || 1) : 1;
    const tp = ok ? (data.data.totalPages || 0) : 0;
    if (infoEl) infoEl.textContent = `共 ${total} 条 / 第 ${page} 页 / 共 ${tp} 页`;
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
    const PAID_STATUSES = new Set(['PAID', 'SHIPPED', 'COMPLETED']);
    const totalAmount = list.reduce((s, o) => s + (PAID_STATUSES.has(o.status) ? (o.totalAmount || 0) : 0), 0);
    const countEl = $('bizorder-count');
    const amountEl = $('bizorder-amount');
    if (countEl) countEl.textContent = `订单数: ${list.length}`;
    if (amountEl) amountEl.textContent = `总成交额: ¥${fen2yuan(totalAmount)}`;
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
bindClick('bizorder-refresh', () => loadOrderList());
bindClick('bizorder-filter-btn', () => {
    const filterEl = $('bizorder-status-filter');
    loadOrderList(filterEl ? filterEl.value : undefined);
});

bindClick('bizorder-create', async () => {
    const buyerEl = $('bizorder-buyer');
    const prodEl = $('bizorder-product');
    const qtyEl = $('bizorder-quantity');
    const addrEl = $('bizorder-address');
    const resultEl = $('bizorder-create-result');
    if (!buyerEl || !prodEl || !qtyEl) return;
    const qs = new URLSearchParams({
        buyerId: buyerEl.value,
        productId: prodEl.value,
        quantity: qtyEl.value,
        address: addrEl ? addrEl.value : ''
    }).toString();
    const data = await api(`/biz/order/create?${qs}`, { method: 'POST' });
    if (resultEl) showResult(resultEl, data);
    if (data.code === 200) {
        await Promise.all([loadOrderList(), loadUserList(), loadProductList()]);
    }
});

bindAll('[data-orderaction]', async (e) => {
    const btn = e.currentTarget;
    const action = btn.dataset.orderaction;
    const orderIdEl = $('bizorder-action-id');
    const opIdEl = $('bizorder-action-opid');
    const resultEl = $('bizorder-action-result');
    if (!orderIdEl || !opIdEl) return;
    const orderId = orderIdEl.value;
    const opId = opIdEl.value;
    let qs;
    if (action === 'ship') qs = `orderId=${orderId}&sellerId=${opId}`;
    else if (action === 'complete') qs = `orderId=${orderId}&buyerId=${opId}`;
    else qs = `orderId=${orderId}&operatorId=${opId}`;
    const data = await api(`/biz/order/${action}?${qs}`, { method: 'POST' });
    if (resultEl) showResult(resultEl, data);
    if (data.code === 200) await loadOrderList();
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

bindAll('.test-btn', async (e) => {
    const btn = e.currentTarget;
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

// ====== 性能测试 ======
const $perfSummary = $('perf-summary');
const $perfDetail = $('perf-detail');

bindClick('perf-run', async () => {
    const apiEl = $('perf-api');
    const threadsEl = $('perf-threads');
    const loopsEl = $('perf-loops');
    const $perfRun = $('perf-run');
    if (!$perfRun || !apiEl || !threadsEl || !loopsEl || !$perfSummary || !$perfDetail) return;
    const apiName = apiEl.value;
    const threads = threadsEl.value;
    const loops = loopsEl.value;

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
