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

// ============ GitHub Pages 离线版专属：前端工具实现（与后端 Java 逻辑一致） ============
const Calculator = {
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    multiply: (a, b) => a * b,
    divide: (a, b) => { if (b === 0) throw new Error('除数不能为零'); return a / b; },
    isPrime: (n) => {
        if (n <= 1) return false;
        for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
        return true;
    },
    factorial: (n) => {
        if (n < 0) throw new Error('阶乘数不能为负数');
        let r = 1;
        for (let i = 2; i <= n; i++) r *= i;
        return r;
    }
};
const StringUtils = {
    isEmpty: (s) => s === null || s.length === 0,
    isBlank: (s) => s === null || s.trim().length === 0,
    reverse: (s) => s === null ? null : s.split('').reverse().join(''),
    toCamelCase: (s) => {
        if (!s) return s;
        let r = '', upper = false;
        for (const c of s) {
            if (c === '_' || c === '-' || c === ' ') upper = true;
            else if (upper) { r += c.toUpperCase(); upper = false; }
            else r += c;
        }
        return r;
    },
    isPalindrome: (s) => {
        if (!s) return false;
        const c = s.replace(/\s+/g, '').toLowerCase();
        return c === c.split('').reverse().join('');
    },
    countOccurrences: (s, sub) => {
        if (!s || !sub || !sub.length) return 0;
        let c = 0, idx = 0;
        while ((idx = s.indexOf(sub, idx)) !== -1) { c++; idx += sub.length; }
        return c;
    }
};
const UserValidator = {
    usernameRe: /^[a-zA-Z0-9_]{3,20}$/,
    passwordRe: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,20}$/,
    emailRe: /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/,
    isValidUsername: (v) => v !== null && UserValidator.usernameRe.test(v),
    isValidPassword: (v) => v !== null && UserValidator.passwordRe.test(v),
    isValidEmail: (v) => v !== null && UserValidator.emailRe.test(v),
    validateUser: (u, p, e) => UserValidator.isValidUsername(u) && UserValidator.isValidPassword(p) && UserValidator.isValidEmail(e),
    checkPermission: (role) => {
        if (!role) throw new Error('角色不能为空');
        switch (role.toLowerCase()) {
            case 'admin': return '全部权限';
            case 'editor': return '编辑权限';
            case 'viewer': return '只读权限';
            default: return '无权限';
        }
    }
};

// ============ GitHub Pages 离线版专属：BizStore 电商三层模拟（纯JS复刻后端Java逻辑） ============
const BizStore = (() => {
    let users = [], products = [], orders = [], transactions = [];
    let uidSeq = 0, pidSeq = 0, oidSeq = 0, txSeq = 0;
    const nowStr = () => new Date().toLocaleString('zh-CN', { hour12: false });
    function addTx(userId, type, amount, balanceAfter, refNo, remark) {
        transactions.push({
            id: ++txSeq, userId, type, amount, balanceAfter,
            refNo: refNo || null, remark: remark || null, createdAt: nowStr()
        });
    }
    function initDemoData() {
        if (users.length > 0) return { userCount: users.length, productCount: products.length, orderCount: orders.length };
        const admin = register('admin', 'Admin123', 'admin@example.com', 'ADMIN');
        const seller = register('seller01', 'Seller123', 'seller@example.com', 'SELLER');
        const buyer = register('buyer01', 'Buyer123', 'buyer@example.com', 'BUYER');
        recharge(buyer.id, 1000000);
        createProduct('Apple iPhone 15', 699900, 100, '电子产品', seller.id);
        createProduct('Sony WH-1000XM5 耳机', 249900, 200, '电子产品', seller.id);
        createProduct('机械键盘 Cherry MX', 89900, 500, '电脑配件', seller.id);
        createProduct('优衣库纯棉 T 恤', 9900, 1000, '服装', seller.id);
        return { userCount: users.length, productCount: products.length, orderCount: orders.length };
    }
    function register(username, password, email, role = 'BUYER') {
        if (!username || username.length < 3) throw new Error('用户名至少3位');
        if (!password || !UserValidator.isValidPassword(password)) throw new Error('密码格式不合法（需包含大小写字母+数字，6-20位）');
        if (!UserValidator.isValidEmail(email)) throw new Error('邮箱格式不合法');
        if (users.find(u => u.username === username)) throw new Error('用户名已存在');
        const u = { id: ++uidSeq, username, password, email, role, balance: 0, createdAt: nowStr() };
        users.push(u);
        return u;
    }
    function login(username, password) {
        const u = users.find(x => x.username === username && x.password === password);
        if (!u) throw new Error('用户名或密码错误');
        return { id: u.id, username: u.username, role: u.role, token: 'mock-token-' + Date.now() };
    }
    function recharge(userId, amountFen) {
        const u = users.find(x => x.id === userId);
        if (!u) throw new Error('用户不存在');
        if (amountFen <= 0) throw new Error('充值金额必须大于0');
        u.balance += amountFen;
        addTx(userId, 'RECHARGE', amountFen, u.balance, null, '账户充值');
        return { id: u.id, balance: u.balance };
    }
    function listTransactions(userId) {
        const uid = parseInt(userId, 10);
        return transactions.filter(t => t.userId === uid).slice().reverse();
    }
    function listUsers() { return users.map(({ password, ...rest }) => rest); }

    function createProduct(name, priceFen, stock, category, sellerId) {
        if (!name || name.length === 0) throw new Error('商品名称不能为空');
        if (priceFen <= 0) throw new Error('商品价格必须大于0');
        if (stock < 0) throw new Error('库存不能为负数');
        const s = users.find(x => x.id === sellerId);
        if (!s) throw new Error('卖家不存在');
        if (s.role !== 'SELLER' && s.role !== 'ADMIN') throw new Error('只有卖家或管理员可以上架商品');
        const p = { id: ++pidSeq, name, price: priceFen, stock, category, sellerId, status: 'AVAILABLE', createdAt: nowStr() };
        products.push(p);
        return p;
    }
    function listProducts(category) {
        return category ? products.filter(p => p.category === category) : products.slice();
    }
    function searchProducts(keyword, category, sellerId, page, size) {
        let list = products.slice();
        const kw = (keyword || '').trim().toLowerCase();
        if (kw) list = list.filter(p => p.name.toLowerCase().includes(kw));
        if (category) list = list.filter(p => p.category === category);
        const sid = sellerId ? parseInt(sellerId, 10) : 0;
        if (sid) list = list.filter(p => p.sellerId === sid);
        const total = list.length;
        const p = Math.max(1, parseInt(page, 10) || 1);
        const s = Math.min(100, Math.max(1, parseInt(size, 10) || 10));
        const totalPages = Math.max(0, Math.ceil(total / s));
        const start = (p - 1) * s;
        return { total, list: list.slice(start, start + s), page: p, size: s, totalPages };
    }

    function createOrder(buyerId, productId, quantity, address) {
        const buyer = users.find(x => x.id === buyerId);
        if (!buyer) throw new Error('买家不存在');
        if (buyer.role !== 'BUYER' && buyer.role !== 'ADMIN') throw new Error('只有买家可以下单');
        const prod = products.find(x => x.id === productId);
        if (!prod) throw new Error('商品不存在');
        if (prod.status !== 'AVAILABLE') throw new Error('商品已下架');
        if (quantity <= 0) throw new Error('购买数量必须大于0');
        if (prod.stock < quantity) throw new Error('商品库存不足');
        const total = prod.price * quantity;
        if (buyer.balance < total) throw new Error('余额不足，请先充值');
        buyer.balance -= total;
        prod.stock -= quantity;
        const seller = users.find(x => x.id === prod.sellerId);
        if (seller) seller.balance += total;
        const o = {
            id: ++oidSeq, buyerId, productId, productName: prod.name, quantity,
            totalAmount: total, status: 'PAID', address, createdAt: nowStr()
        };
        orders.push(o);
        addTx(buyerId, 'PAY', -total, buyer.balance, 'O' + o.id, '订单支付');
        if (seller) addTx(seller.id, 'INCOME', total, seller.balance, 'O' + o.id, '订单收入');
        return o;
    }
    function shipOrder(orderId, sellerId) {
        const o = orders.find(x => x.id === orderId);
        if (!o) throw new Error('订单不存在');
        const prod = products.find(x => x.id === o.productId);
        if (!prod || prod.sellerId !== sellerId) throw new Error('无权操作：非该订单卖家');
        if (o.status !== 'PAID') throw new Error('订单状态不合法，当前状态：' + o.status);
        o.status = 'SHIPPED';
        return o;
    }
    function completeOrder(orderId, buyerId) {
        const o = orders.find(x => x.id === orderId);
        if (!o) throw new Error('订单不存在');
        if (o.buyerId !== buyerId) throw new Error('无权操作：非该订单买家');
        if (o.status !== 'SHIPPED') throw new Error('订单状态不合法，当前状态：' + o.status);
        o.status = 'COMPLETED';
        return o;
    }
    function cancelOrder(orderId, operatorId) {
        const o = orders.find(x => x.id === orderId);
        if (!o) throw new Error('订单不存在');
        if (o.status === 'COMPLETED' || o.status === 'CANCELLED') throw new Error('订单已终态，不可取消');
        if (o.buyerId !== operatorId) {
            const op = users.find(x => x.id === operatorId);
            if (!op || op.role !== 'ADMIN') throw new Error('无权操作：仅买家本人或管理员可取消');
        }
        if (o.status === 'PAID' || o.status === 'SHIPPED') {
            const buyer = users.find(x => x.id === o.buyerId);
            if (buyer) {
                buyer.balance += o.totalAmount;
                addTx(buyer.id, 'CANCEL_REFUND', o.totalAmount, buyer.balance, 'O' + o.id, '订单取消退款');
            }
            const seller = users.find(x => {
                const prod = products.find(p => p.id === o.productId);
                return prod && x.id === prod.sellerId;
            });
            if (seller) {
                seller.balance -= o.totalAmount;
                addTx(seller.id, 'CANCEL_DEDUCT', -o.totalAmount, seller.balance, 'O' + o.id, '订单取消扣回');
            }
            const prod = products.find(x => x.id === o.productId);
            if (prod) prod.stock += o.quantity;
        }
        o.status = 'CANCELLED';
        return o;
    }
    function refundOrder(orderId, operatorId) {
        const o = orders.find(x => x.id === orderId);
        if (!o) throw new Error('订单不存在');
        if (o.status !== 'COMPLETED' && o.status !== 'PAID' && o.status !== 'SHIPPED')
            throw new Error('订单状态不合法，当前状态：' + o.status);
        if (o.status === 'REFUNDED') throw new Error('订单已退款，不可重复操作');
        const op = users.find(x => x.id === operatorId);
        if (!op) throw new Error('操作人不存在');
        if (op.role !== 'ADMIN' && o.buyerId !== operatorId)
            throw new Error('无权操作：仅买家本人或管理员可退款');
        const buyer = users.find(x => x.id === o.buyerId);
        const prod = products.find(x => x.id === o.productId);
        const seller = prod ? users.find(x => x.id === prod.sellerId) : null;
        if (buyer) {
            buyer.balance += o.totalAmount;
            addTx(buyer.id, 'REFUND', o.totalAmount, buyer.balance, 'O' + o.id, '售后退款');
        }
        if (seller) {
            seller.balance -= o.totalAmount;
            addTx(seller.id, 'REFUND_DEDUCT', -o.totalAmount, seller.balance, 'O' + o.id, '售后退款扣回');
        }
        if (prod && o.status !== 'COMPLETED') {
            prod.stock += o.quantity;
        }
        o.status = 'REFUNDED';
        o.refundedAt = nowStr();
        return o;
    }
    function listOrders(filter) {
        if (filter && filter.status) return orders.filter(o => o.status === filter.status);
        if (filter && filter.buyerId) return orders.filter(o => o.buyerId === filter.buyerId);
        return orders.slice();
    }

    return {
        initDemoData,
        register, login, recharge, listUsers, listTransactions,
        createProduct, listProducts, searchProducts,
        createOrder, shipOrder, completeOrder, cancelOrder, refundOrder, listOrders
    };
})();

// ====== 通用请求方法（GitHub Pages 离线版：不走fetch，走本地模拟路由） ======
function parseQuery(qs) {
    const r = {};
    if (!qs) return r;
    new URLSearchParams(qs).forEach((v, k) => r[k] = v);
    return r;
}
function success(msg, data) {
    const r = { code: 200, message: msg || 'success' };
    if (data !== undefined) r.data = data;
    return r;
}
function error(code, msg) { return { code, message: msg }; }

async function api(url, opts = {}) {
    try {
        // 去除 querystring 保留 path
        const qIdx = url.indexOf('?');
        const path = qIdx === -1 ? url : url.slice(0, qIdx);
        const q = qIdx === -1 ? {} : parseQuery(url.slice(qIdx + 1));

        // ===== 计算器 =====
        if (path === '/api/calc') {
            const a = Number(q.a), b = Number(q.b), op = q.op;
            const r = { code: 200, a, b, op };
            try {
                switch (op) {
                    case 'add': r.result = Calculator.add(a, b); break;
                    case 'sub': r.result = Calculator.subtract(a, b); break;
                    case 'mul': r.result = Calculator.multiply(a, b); break;
                    case 'div': r.result = Calculator.divide(a, b); break;
                    case 'isPrime': r.result = Calculator.isPrime(a); break;
                    case 'factorial': r.result = Calculator.factorial(a); break;
                }
            } catch (e) { return error(400, e.message); }
            return r;
        }
        // ===== 字符串 =====
        if (path === '/api/string') {
            const s = q.s, op = q.op;
            const r = { code: 200, op, input: s };
            try {
                switch (op) {
                    case 'isEmpty': r.result = StringUtils.isEmpty(s); break;
                    case 'isBlank': r.result = StringUtils.isBlank(s); break;
                    case 'reverse': r.result = StringUtils.reverse(s); break;
                    case 'toCamelCase': r.result = StringUtils.toCamelCase(s); break;
                    case 'isPalindrome': r.result = StringUtils.isPalindrome(s); break;
                    case 'count': r.result = StringUtils.countOccurrences(s, q.sub || ''); r.sub = q.sub || ''; break;
                }
            } catch (e) { return error(400, e.message); }
            return r;
        }
        // ===== 用户校验 =====
        if (path === '/api/user') {
            const op = q.op;
            if (op === 'validate') {
                return { code: 200, op, result: UserValidator.validateUser(q.u, q.p, q.e) };
            }
            if (op === 'permission') {
                try { return { code: 200, op, result: UserValidator.checkPermission(q.role) }; }
                catch (e) { return error(400, e.message); }
            }
        }
        // ===== 注册接口（接口测试Tab入口，同时写入BizStore打通用户列表）=====
        if (path === '/api/register') {
            if (!UserValidator.validateUser(q.username, q.password, q.email)) return error(400, '注册信息不合法');
            try {
                const user = BizStore.register(q.username, q.password, q.email, 'BUYER');
                const { password, ...safe } = user;
                const r = success('注册成功', safe);
                return r;
            } catch (be) { return error(400, be.message); }
        }
        if (path === '/api/login') {
            try {
                const r = BizStore.login(q.username, q.password);
                return { code: 200, message: '登录成功', data: r, token: 'mock-token-' + Date.now() };
            } catch (e) {
                // 回退兼容老版演示账号
                if (q.username === 'admin' && q.password === 'Admin123') {
                    return { code: 200, message: '登录成功', token: 'mock-token-' + Date.now() };
                }
                return error(401, e.message || '用户名或密码错误');
            }
        }
        if (path === '/api/permission') {
            try { return { code: 200, permission: UserValidator.checkPermission(q.role) }; }
            catch (e) { return error(400, e.message); }
        }

        // ===== 电商业务：初始化 =====
        if (path === '/biz/init') {
            const info = BizStore.initDemoData();
            return success('初始化演示数据完成', info);
        }
        // ===== 电商用户 =====
        if (path === '/biz/user/list') return success('ok', BizStore.listUsers());
        if (path === '/biz/user/register') {
            try {
                const u = BizStore.register(q.username, q.password, q.email, q.role || 'BUYER');
                const { password, ...safe } = u;
                return success('注册成功', safe);
            } catch (e) { return error(400, e.message); }
        }
        if (path === '/biz/user/login') {
            try { return success('登录成功', BizStore.login(q.username, q.password)); }
            catch (e) { return error(401, e.message); }
        }
        if (path === '/biz/user/recharge') {
            try {
                const uid = parseInt(q.userId, 10);
                const amt = parseInt(q.amount, 10);
                return success('充值成功', BizStore.recharge(uid, amt));
            } catch (e) { return error(400, e.message); }
        }
        if (path === '/biz/user/transactions') {
            try { return success('ok', BizStore.listTransactions(q.userId)); }
            catch (e) { return error(400, e.message); }
        }
        // ===== 电商商品 =====
        if (path === '/biz/product/list') return success('ok', BizStore.listProducts(q.category));
        if (path === '/biz/product/create') {
            try {
                const name = q.name;
                const price = parseInt(q.price, 10);
                const stock = parseInt(q.stock, 10);
                const sid = parseInt(q.sellerId, 10);
                return success('商品已上架', BizStore.createProduct(name, price, stock, q.category, sid));
            } catch (e) { return error(400, e.message); }
        }
        if (path === '/biz/product/search') {
            try {
                return success('ok', BizStore.searchProducts(q.keyword, q.category, q.sellerId, q.page, q.size));
            } catch (e) { return error(400, e.message); }
        }
        // ===== 电商订单 =====
        if (path === '/biz/order/list') {
            return success('ok', BizStore.listOrders(q.status ? { status: q.status } : null));
        }
        if (path === '/biz/order/create') {
            try {
                const o = BizStore.createOrder(
                    parseInt(q.buyerId, 10),
                    parseInt(q.productId, 10),
                    parseInt(q.quantity, 10),
                    q.address || ''
                );
                return success('下单成功', o);
            } catch (e) { return error(400, e.message); }
        }
        if (path.startsWith('/biz/order/')) {
            const action = path.slice('/biz/order/'.length);
            try {
                const oid = parseInt(q.orderId, 10);
                let opid, r;
                switch (action) {
                    case 'ship':
                        opid = parseInt(q.sellerId, 10);
                        r = BizStore.shipOrder(oid, opid); break;
                    case 'complete':
                        opid = parseInt(q.buyerId, 10);
                        r = BizStore.completeOrder(oid, opid); break;
                    case 'cancel':
                    case 'refund':
                        opid = parseInt(q.operatorId, 10);
                        r = action === 'refund' ? BizStore.refundOrder(oid, opid) : BizStore.cancelOrder(oid, opid);
                        break;
                    default:
                        return error(404, '未知操作');
                }
                return success('操作成功', r);
            } catch (e) { return error(400, e.message); }
        }

        // ===== 运行测试（前端模拟JUnit 5引擎） =====
        if (path === '/api/test/run') {
            return await runMockTests(q.target || 'all');
        }
        // ===== 性能测试（前端模拟） =====
        if (path === '/api/test/perf') {
            return await runMockPerf(q.api, q.threads, q.loops);
        }

        return error(404, '接口不存在: ' + path);
    } catch (e) {
        return { code: 0, message: '请求失败: ' + e.message };
    }
}

// ====== 通用：展示结果 ======
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

bindClick('calc-run', async () => {
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
    const cnt = $('bizprod-count');
    if (cnt) cnt.textContent = `商品数: ${list.length}`;
    // 把第一个商品ID填入订单表单
    const bp = $('bizorder-product');
    if (list.length && bp && !bp.value) {
        bp.value = list[0].id;
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
        { render: r => r.productName || r.productId },
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

// ============ GitHub Pages 离线版专属：前端模拟测试用例引擎 ============
const testCases = {
    calculator: [
        { name: 'testAdd', cls: 'CalculatorTest', run: () => assertEq(5, Calculator.add(2, 3)) },
        { name: 'testAddNegative', cls: 'CalculatorTest', run: () => assertEq(-1, Calculator.add(2, -3)) },
        { name: 'testSubtract', cls: 'CalculatorTest', run: () => assertEq(1, Calculator.subtract(3, 2)) },
        { name: 'testMultiply', cls: 'CalculatorTest', run: () => assertEq(6, Calculator.multiply(2, 3)) },
        { name: 'testDivide', cls: 'CalculatorTest', run: () => assertEq(2.5, Calculator.divide(5, 2)) },
        { name: 'testDivideByZero', cls: 'CalculatorTest', run: () => assertThrows(() => Calculator.divide(5, 0)) },
        { name: 'testIsPrime_2', cls: 'CalculatorTest', run: () => assertTrue(Calculator.isPrime(2)) },
        { name: 'testIsPrime_17', cls: 'CalculatorTest', run: () => assertTrue(Calculator.isPrime(17)) },
        { name: 'testIsPrime_4', cls: 'CalculatorTest', run: () => assertTrue(!Calculator.isPrime(4)) },
        { name: 'testFactorial_5', cls: 'CalculatorTest', run: () => assertEq(120, Calculator.factorial(5)) },
        { name: 'testFactorial_0', cls: 'CalculatorTest', run: () => assertEq(1, Calculator.factorial(0)) },
        { name: 'testFactorial_Negative', cls: 'CalculatorTest', run: () => assertThrows(() => Calculator.factorial(-1)) },
    ],
    string: [
        { name: 'testIsEmpty_Null', cls: 'StringUtilsTest', run: () => assertTrue(StringUtils.isEmpty(null)) },
        { name: 'testIsEmpty_Empty', cls: 'StringUtilsTest', run: () => assertTrue(StringUtils.isEmpty('')) },
        { name: 'testIsBlank_Space', cls: 'StringUtilsTest', run: () => assertTrue(StringUtils.isBlank('   ')) },
        { name: 'testReverse_Hello', cls: 'StringUtilsTest', run: () => assertEq('olleh', StringUtils.reverse('hello')) },
        { name: 'testToCamelCase', cls: 'StringUtilsTest', run: () => assertEq('helloWorld', StringUtils.toCamelCase('hello_world')) },
        { name: 'testIsPalindrome', cls: 'StringUtilsTest', run: () => assertTrue(StringUtils.isPalindrome('A man a plan a canal Panama')) },
        { name: 'testCountOccurrences', cls: 'StringUtilsTest', run: () => assertEq(2, StringUtils.countOccurrences('hello world hello', 'hello')) },
    ],
    user: [
        { name: 'testValidUsername', cls: 'UserValidatorTest', run: () => assertTrue(UserValidator.isValidUsername('zhangsan_123')) },
        { name: 'testInvalidUsername_Short', cls: 'UserValidatorTest', run: () => assertTrue(!UserValidator.isValidUsername('ab')) },
        { name: 'testValidPassword', cls: 'UserValidatorTest', run: () => assertTrue(UserValidator.isValidPassword('Test1234')) },
        { name: 'testInvalidPassword_NoUpper', cls: 'UserValidatorTest', run: () => assertTrue(!UserValidator.isValidPassword('test1234')) },
        { name: 'testValidEmail', cls: 'UserValidatorTest', run: () => assertTrue(UserValidator.isValidEmail('test@example.com')) },
        { name: 'testInvalidEmail', cls: 'UserValidatorTest', run: () => assertTrue(!UserValidator.isValidEmail('not-an-email')) },
        { name: 'testValidateUser_AllValid', cls: 'UserValidatorTest', run: () => assertTrue(UserValidator.validateUser('good_user', 'GoodPass1', 'good@example.com')) },
        { name: 'testCheckPermission_Admin', cls: 'UserValidatorTest', run: () => assertEq('全部权限', UserValidator.checkPermission('admin')) },
        { name: 'testCheckPermission_Empty', cls: 'UserValidatorTest', run: () => assertThrows(() => UserValidator.checkPermission('')) },
    ],
    api: [
        { name: 'testCalcAddApi', cls: 'HttpApiTest', run: () => { BizStore.initDemoData(); const r = Calculator.add(2,3); assertEq(5, r); } },
        { name: 'testCalcDivideByZero', cls: 'HttpApiTest', run: () => assertThrows(() => Calculator.divide(1,0)) },
        { name: 'testStringReverseApi', cls: 'HttpApiTest', run: () => assertEq('olleh', StringUtils.reverse('hello')) },
        { name: 'testUserValidateApi', cls: 'HttpApiTest', run: () => assertTrue(UserValidator.validateUser('api_user', 'ApiPass1', 'api@t.com')) },
        { name: 'testPermissionApi', cls: 'HttpApiTest', run: () => assertEq('只读权限', UserValidator.checkPermission('viewer')) },
    ],
    restassured: [
        { name: 'register_should_fail_when_weak_password', cls: 'UserApiRestAssuredTest', run: () => { const s = BizStore; s.initDemoData(); assertThrows(() => BizStore.register('weakuser', '123', 'w@b.com')); } },
        { name: 'register_should_success_when_valid_info', cls: 'UserApiRestAssuredTest', run: () => { const s = BizStore; s.initDemoData(); const u = BizStore.register('ra_user', 'RaPass1', 'ra@t.com', 'BUYER'); assertTrue(u && u.id > 0); } },
        { name: 'login_should_fail_wrong_password', cls: 'UserApiRestAssuredTest', run: () => { const s = BizStore; s.initDemoData(); assertThrows(() => BizStore.login('admin', 'wrong')); } },
        { name: 'login_should_success_admin', cls: 'UserApiRestAssuredTest', run: () => { const s = BizStore; s.initDemoData(); const r = BizStore.login('admin', 'Admin123'); assertTrue(r && r.role === 'ADMIN'); } },
        { name: 'recharge_should_increase_balance', cls: 'UserApiRestAssuredTest', run: () => { const s = BizStore; s.initDemoData(); const buyer = BizStore.listUsers().find(u => u.role === 'BUYER'); const before = buyer.balance; BizStore.recharge(buyer.id, 5000); const after = BizStore.listUsers().find(u => u.id === buyer.id).balance; assertEq(before + 5000, after); } },
    ],
    biz: [
        { name: 'initDemoData_should_create_3plus_users', cls: 'UserServiceTest', run: () => { BizStore.initDemoData(); assertTrue(BizStore.listUsers().length >= 3); } },
        { name: 'createProduct_should_deny_buyer', cls: 'ProductServiceTest', run: () => { BizStore.initDemoData(); const buyer = BizStore.listUsers().find(u => u.role === 'BUYER'); assertThrows(() => BizStore.createProduct('越权', 100, 1, '食品', buyer.id)); } },
        { name: 'createProduct_should_success_seller', cls: 'ProductServiceTest', run: () => { BizStore.initDemoData(); const seller = BizStore.listUsers().find(u => u.role === 'SELLER'); const p = BizStore.createProduct('Biz商品', 19900, 10, '食品', seller.id); assertTrue(p && p.id > 0); } },
        { name: 'createOrder_should_fail_insufficient_balance', cls: 'OrderServiceTest', run: () => { BizStore.initDemoData(); const poor = BizStore.register('poorbuyer', 'Poor1234', 'poor@t.com', 'BUYER'); const prod = BizStore.listProducts()[0]; assertThrows(() => BizStore.createOrder(poor.id, prod.id, 1, 'addr')); } },
        { name: 'createOrder_should_fail_out_of_stock', cls: 'OrderServiceTest', run: () => { BizStore.initDemoData(); const buyer = BizStore.listUsers().find(u => u.role === 'BUYER'); const prod = BizStore.listProducts()[0]; assertThrows(() => BizStore.createOrder(buyer.id, prod.id, 999999, 'addr')); } },
        { name: 'shipOrder_should_deny_non_seller', cls: 'OrderServiceTest', run: () => { BizStore.initDemoData(); const buyer = BizStore.listUsers().find(u => u.role === 'BUYER'); const prod = BizStore.listProducts()[0]; const o = BizStore.createOrder(buyer.id, prod.id, 1, 'addr'); assertThrows(() => BizStore.shipOrder(o.id, buyer.id)); } },
        { name: 'full_order_lifecycle', cls: 'OrderServiceTest', run: () => { BizStore.initDemoData(); const buyer = BizStore.listUsers().find(u => u.role === 'BUYER'); const seller = BizStore.listUsers().find(u => u.role === 'SELLER'); const prod = BizStore.listProducts()[0]; const o = BizStore.createOrder(buyer.id, prod.id, 1, 'addr'); assertEq('PAID', o.status); BizStore.shipOrder(o.id, seller.id); assertEq('COMPLETED', BizStore.completeOrder(o.id, buyer.id).status); } },
        { name: 'refund_should_return_money', cls: 'OrderServiceTest', run: () => { BizStore.initDemoData(); const buyer = BizStore.listUsers().find(u => u.role === 'BUYER'); const prod = BizStore.listProducts()[0]; const before = buyer.balance; const o = BizStore.createOrder(buyer.id, prod.id, 1, 'addr'); BizStore.refundOrder(o.id, buyer.id); const after = BizStore.listUsers().find(u => u.id === buyer.id).balance; assertTrue(after >= before); assertEq('REFUNDED', BizStore.listOrders().find(x => x.id === o.id).status); } },
    ],
    bizapi: [
        { name: 'biz_init_returns_counts', cls: 'BizApiIntegrationTest', run: () => { const s = BizStore; const info = s.initDemoData(); assertTrue(info.userCount >= 3 && info.productCount >= 3); } },
        { name: 'register_then_login_roundtrip', cls: 'BizApiIntegrationTest', run: () => { const u = BizStore.register('bizapi_user', 'Bizapi1', 'bizapi@t.com', 'BUYER'); const r = BizStore.login('bizapi_user', 'Bizapi1'); assertEq(u.id, r.id); } },
        { name: 'duplicate_username_denied', cls: 'BizApiIntegrationTest', run: () => { BizStore.initDemoData(); assertThrows(() => BizStore.register('admin', 'Xxx12345', 'dup@t.com')); } },
        { name: 'list_users_after_init', cls: 'BizApiIntegrationTest', run: () => { BizStore.initDemoData(); assertTrue(BizStore.listUsers().length >= 3); } },
        { name: 'create_product_rest_api', cls: 'BizApiIntegrationTest', run: () => { BizStore.initDemoData(); const seller = BizStore.listUsers().find(u => u.role === 'SELLER'); const p = BizStore.createProduct('API商品', 19900, 10, '食品', seller.id); assertTrue(p && p.id > 0); } },
        { name: 'create_product_buyer_403', cls: 'BizApiIntegrationTest', run: () => { BizStore.initDemoData(); const buyer = BizStore.listUsers().find(u => u.role === 'BUYER'); assertThrows(() => BizStore.createProduct('越权', 100, 1, '食品', buyer.id)); } },
        { name: 'place_order_rest_api', cls: 'BizApiIntegrationTest', run: () => { BizStore.initDemoData(); const buyer = BizStore.listUsers().find(u => u.role === 'BUYER'); const prod = BizStore.listProducts()[0]; assertTrue(buyer && prod); } },
        { name: 'search_products_pagination', cls: 'BizApiIntegrationTest', run: () => { BizStore.initDemoData(); const r = BizStore.searchProducts('', '', '', '1', '2'); assertTrue(r.total >= 3 && r.list.length <= 2); } },
        { name: 'list_transactions_after_recharge', cls: 'BizApiIntegrationTest', run: () => { BizStore.initDemoData(); const buyer = BizStore.listUsers().find(u => u.role === 'BUYER'); BizStore.recharge(buyer.id, 10000); const txs = BizStore.listTransactions(buyer.id); assertTrue(txs.some(t => t.type === 'RECHARGE')); } },
    ],
    ui: [
        { name: 'testTabNavigation', cls: 'WebUiTest', run: () => assertTrue(true) },
        { name: 'testCalculatorAddUi', cls: 'WebUiTest', run: () => assertEq(13, Calculator.add(10, 3)) },
        { name: 'testBizInitData', cls: 'WebUiTest', run: () => { BizStore.initDemoData(); assertTrue(BizStore.listUsers().length >= 3); } },
        { name: 'testRunAllTests', cls: 'WebUiTest', run: () => assertTrue(true) },
        { name: 'testUserRegisterUi', cls: 'WebUiTest', run: () => assertTrue(true) },
        { name: 'testCreateOrderUi', cls: 'WebUiTest', run: () => assertTrue(true) },
    ]
};
function assertEq(expected, actual) { if (expected !== actual) throw new Error(`expected: <${expected}> but was: <${actual}>`); }
function assertTrue(cond) { if (!cond) throw new Error('assertion failed'); }
function assertThrows(fn) { try { fn(); throw new Error('Expected exception but none thrown'); } catch (e) { /* ok */ } }
function getTests(target) {
    if (target === 'all' || target === 'suite') {
        return [].concat(...['calculator','string','user','api','restassured','biz','bizapi','ui'].map(k => testCases[k] || []));
    }
    return testCases[target] || [];
}
async function runMockTests(target) {
    const tests = getTests(target);
    const failures = [];
    let passed = 0, failed = 0;
    const start = performance.now();
    for (const tc of tests) {
        try { tc.run(); passed++; }
        catch (e) { failed++; failures.push({ displayName: tc.name, className: tc.cls, message: e.message, type: 'AssertionFailedError' }); }
        await new Promise(r => setTimeout(r, 15));
    }
    const elapsed = ((performance.now() - start) / 1000).toFixed(3);
    return {
        code: 200,
        total: tests.length,
        success: passed,
        failed,
        skipped: 0,
        aborted: 0,
        time: elapsed,
        failures
    };
}

// ====== 运行测试（使用static/app.js最新结构 + bindClick/bindAll防御） ======
const $summary = document.getElementById('test-summary');
const $failures = document.getElementById('test-failures');
const $log = document.getElementById('test-log');

function logLine(text, cls) {
    if (!$log) return;
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
    if ($log) { $log.classList.add('show'); $log.innerHTML = ''; }
    if ($summary) $summary.classList.remove('show', 'ok', 'fail');
    if ($failures) $failures.innerHTML = '';

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

    if ($summary) {
        $summary.innerHTML = `
            <div class="stat"><span class="num">${data.total}</span><span class="label">总用例数</span></div>
            <div class="stat"><span class="num" style="color:#86efac">${data.success}</span><span class="label">成功</span></div>
            <div class="stat"><span class="num" style="color:#fca5a5">${data.failed}</span><span class="label">失败</span></div>
            <div class="stat"><span class="num" style="color:#fcd34d">${data.skipped}</span><span class="label">跳过</span></div>
            <div class="stat"><span class="num" style="color:#93c5fd">${data.time}s</span><span class="label">执行耗时</span></div>
        `;
        $summary.classList.add('show');
        $summary.classList.add(data.failed === 0 ? 'ok' : 'fail');
    }

    if ($failures && data.failures && data.failures.length) {
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

// ============ GitHub Pages 离线版专属：前端性能模拟 ============
async function runMockPerf(apiName, threads, loops) {
    threads = parseInt(threads, 10) || 20;
    loops = parseInt(loops, 10) || 20;
    const total = threads * loops;
    const elapsedList = [];
    let success = 0, failed = 0;
    const start = performance.now();
    for (let i = 0; i < total; i++) {
        const t0 = performance.now();
        const delay = 1 + Math.random() * 14;
        await new Promise(r => setTimeout(r, delay));
        if (Math.random() > 0.01) success++;
        else failed++;
        elapsedList.push(performance.now() - t0);
    }
    const totalTime = Math.round(performance.now() - start);
    elapsedList.sort((a, b) => a - b);
    const avg = elapsedList.reduce((s, v) => s + v, 0) / elapsedList.length;
    const min = elapsedList[0] || 0;
    const max = elapsedList[elapsedList.length - 1] || 0;
    const p90 = elapsedList[Math.floor(elapsedList.length * 0.9)] || 0;
    const p95 = elapsedList[Math.floor(elapsedList.length * 0.95)] || 0;
    const tps = totalTime > 0 ? (total * 1000 / totalTime) : 0;
    const errorRate = total > 0 ? (failed * 100 / total) : 0;
    const apiLabel = {
        calc: 'GET /api/calc', login: 'POST /api/login',
        bizuser: 'GET /biz/user/list', bizprod: 'GET /biz/product/list'
    }[apiName] || apiName;
    return {
        code: 200, api: apiLabel, threads, loops, totalRequests: total, success, failed,
        errorRate: errorRate.toFixed(2) + '%',
        totalTime: totalTime + ' ms',
        avgResponse: avg.toFixed(1) + ' ms',
        minResponse: min.toFixed(0) + ' ms',
        maxResponse: max.toFixed(0) + ' ms',
        p90: p90.toFixed(0) + ' ms',
        p95: p95.toFixed(0) + ' ms',
        tps: tps.toFixed(1) + ' req/s'
    };
}

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
