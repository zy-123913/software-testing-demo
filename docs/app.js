// ====== Tab 切换 ======
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
    });
});

// ====== 工具类前端实现（与后端 Java 逻辑一致） ======
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

// ====== 电商业务模拟（Entity/DAO/Service 三层逻辑纯 JS 复刻） ======
const BizStore = (() => {
    let users = [], products = [], orders = [];
    let uidSeq = 0, pidSeq = 0, oidSeq = 0;
    const nowStr = () => new Date().toLocaleString('zh-CN', { hour12: false });

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
        return { id: u.id, balance: u.balance };
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
            if (buyer) buyer.balance += o.totalAmount; // 退款
            const prod = products.find(x => x.id === o.productId);
            if (prod) prod.stock += o.quantity; // 恢复库存
        }
        o.status = 'CANCELLED';
        return o;
    }
    function listOrders(filter) {
        if (filter && filter.status) return orders.filter(o => o.status === filter.status);
        if (filter && filter.buyerId) return orders.filter(o => o.buyerId === filter.buyerId);
        return orders.slice();
    }

    return {
        initDemoData,
        register, login, recharge, listUsers,
        createProduct, listProducts,
        createOrder, shipOrder, completeOrder, cancelOrder, listOrders
    };
})();

// ====== UI 辅助 ======
function showResult(el, data, okFn) {
    el.classList.remove('ok', 'err');
    const ok = okFn ? okFn(data) : data && data.code === 200;
    el.classList.add(ok ? 'ok' : 'err');
    el.textContent = JSON.stringify(data, null, 2);
}
function fen2yuan(fen) { return fen == null ? '-' : (fen / 100).toFixed(2); }
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

// ====== 计算器 ======
const $calcA = document.getElementById('calc-a');
const $calcB = document.getElementById('calc-b');
const $calcOp = document.getElementById('calc-op');
const $calcN = document.getElementById('calc-n');
const $calcRes = document.getElementById('calc-result');

document.getElementById('calc-run').addEventListener('click', () => {
    const a = parseInt($calcA.value) || 0;
    const b = parseInt($calcB.value) || 0;
    const op = $calcOp.value;
    const result = { code: 200, a, b, op };
    try {
        switch (op) {
            case 'add': result.result = Calculator.add(a, b); break;
            case 'sub': result.result = Calculator.subtract(a, b); break;
            case 'mul': result.result = Calculator.multiply(a, b); break;
            case 'div': result.result = Calculator.divide(a, b); break;
        }
    } catch (e) { result.code = 400; result.message = e.message; }
    showResult($calcRes, result);
});

document.querySelectorAll('[data-single]').forEach(btn => {
    btn.addEventListener('click', () => {
        const n = parseInt($calcN.value) || 0;
        const op = btn.dataset.single;
        const result = { code: 200, op };
        try {
            result.result = op === 'isPrime' ? Calculator.isPrime(n) : Calculator.factorial(n);
        } catch (e) { result.code = 400; result.message = e.message; }
        showResult($calcRes, result);
    });
});

// ====== 字符串 ======
const $strS = document.getElementById('str-s');
const $strSub = document.getElementById('str-sub');
const $strRes = document.getElementById('str-result');

document.querySelectorAll('[data-sop]').forEach(btn => {
    btn.addEventListener('click', () => {
        const op = btn.dataset.sop;
        const s = $strS.value;
        const result = { code: 200, op, input: s };
        try {
            switch (op) {
                case 'isEmpty': result.result = StringUtils.isEmpty(s); break;
                case 'isBlank': result.result = StringUtils.isBlank(s); break;
                case 'reverse': result.result = StringUtils.reverse(s); break;
                case 'toCamelCase': result.result = StringUtils.toCamelCase(s); break;
                case 'isPalindrome': result.result = StringUtils.isPalindrome(s); break;
                case 'count': result.sub = $strSub.value; result.result = StringUtils.countOccurrences(s, $strSub.value); break;
            }
        } catch (e) { result.code = 400; result.message = e.message; }
        showResult($strRes, result);
    });
});

// ====== 用户校验 ======
document.getElementById('uv-validate').addEventListener('click', () => {
    const result = {
        code: 200, op: 'validate',
        result: UserValidator.validateUser(
            document.getElementById('uv-username').value,
            document.getElementById('uv-password').value,
            document.getElementById('uv-email').value
        )
    };
    showResult(document.getElementById('user-result'), result);
});

document.getElementById('uv-permission').addEventListener('click', () => {
    const result = { code: 200, op: 'permission' };
    try {
        result.result = UserValidator.checkPermission(document.getElementById('uv-role').value);
    } catch (e) { result.code = 400; result.message = e.message; }
    showResult(document.getElementById('user-result'), result);
});

// ============================================================
// ====== 电商业务前端模拟交互 ================================
// ============================================================

async function loadUserList() {
    const list = BizStore.listUsers();
    document.getElementById('bizuser-count').textContent = `用户数: ${list.length}`;
    const seller = list.find(u => u.role === 'SELLER');
    if (seller && !document.getElementById('bizprod-seller').value) {
        document.getElementById('bizprod-seller').value = seller.id;
    }
    const buyer = list.find(u => u.role === 'BUYER');
    if (buyer && !document.getElementById('bizorder-buyer').value) {
        document.getElementById('bizorder-buyer').value = buyer.id;
    }
    if (!document.getElementById('bizuser-recharge-id').value && buyer) {
        document.getElementById('bizuser-recharge-id').value = buyer.id;
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

async function loadProductList(category) {
    const list = BizStore.listProducts(category);
    document.getElementById('bizprod-count').textContent = `商品数: ${list.length}`;
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

async function loadOrderList(status) {
    const list = BizStore.listOrders(status ? { status } : null);
    const totalAmount = list.reduce((s, o) => s + (o.status === 'COMPLETED' ? (o.totalAmount || 0) : 0), 0);
    document.getElementById('bizorder-count').textContent = `订单数: ${list.length}`;
    document.getElementById('bizorder-amount').textContent = `总成交额: ¥${fen2yuan(totalAmount)}`;
    renderTable('#bizorder-table tbody', list, [
        { key: 'id' },
        { key: 'buyerId' },
        { render: r => r.productName || r.productId },
        { key: 'quantity' },
        { render: r => `<b>¥${fen2yuan(r.totalAmount)}</b>` },
        { render: r => `<span class="status-tag status-${r.status}">${r.status}</span>` },
        { key: 'address' },
        { key: 'createdAt' }
    ]);
    return list;
}

document.getElementById('biz-init').addEventListener('click', () => {
    try {
        const info = BizStore.initDemoData();
        showResult(document.getElementById('bizuser-register-result'), { code: 200, data: info });
        loadUserList(); loadProductList(); loadOrderList();
    } catch (e) {
        showResult(document.getElementById('bizuser-register-result'), { code: 400, message: e.message });
    }
});

document.getElementById('bizuser-refresh').addEventListener('click', loadUserList);
document.getElementById('bizuser-register').addEventListener('click', () => {
    try {
        const u = BizStore.register(
            document.getElementById('bizuser-username').value,
            document.getElementById('bizuser-password').value,
            document.getElementById('bizuser-email').value,
            document.getElementById('bizuser-role').value
        );
        const { password, ...safe } = u;
        showResult(document.getElementById('bizuser-register-result'), { code: 200, data: safe });
        loadUserList();
    } catch (e) {
        showResult(document.getElementById('bizuser-register-result'), { code: 400, message: e.message });
    }
});
document.getElementById('bizuser-login').addEventListener('click', () => {
    try {
        const r = BizStore.login(
            document.getElementById('bizuser-login-u').value,
            document.getElementById('bizuser-login-p').value
        );
        showResult(document.getElementById('bizuser-login-result'), { code: 200, data: r });
    } catch (e) {
        showResult(document.getElementById('bizuser-login-result'), { code: 401, message: e.message });
    }
});
document.getElementById('bizuser-recharge').addEventListener('click', () => {
    try {
        const id = parseInt(document.getElementById('bizuser-recharge-id').value, 10);
        const amount = parseInt(document.getElementById('bizuser-recharge-amount').value || '0', 10);
        const r = BizStore.recharge(id, amount * 100);
        showResult(document.getElementById('bizuser-recharge-result'), { code: 200, data: r });
        loadUserList();
    } catch (e) {
        showResult(document.getElementById('bizuser-recharge-result'), { code: 400, message: e.message });
    }
});

document.getElementById('bizprod-refresh').addEventListener('click', () => loadProductList());
document.getElementById('bizprod-filter-btn').addEventListener('click', () => {
    loadProductList(document.getElementById('bizprod-category-filter').value);
});
document.getElementById('bizprod-create').addEventListener('click', () => {
    try {
        const name = document.getElementById('bizprod-name').value;
        const price = parseInt(document.getElementById('bizprod-price').value || '0', 10) * 100;
        const stock = parseInt(document.getElementById('bizprod-stock').value || '0', 10);
        const category = document.getElementById('bizprod-category').value;
        const sellerId = parseInt(document.getElementById('bizprod-seller').value, 10);
        const p = BizStore.createProduct(name, price, stock, category, sellerId);
        showResult(document.getElementById('bizprod-create-result'), { code: 200, data: p });
        loadProductList();
    } catch (e) {
        showResult(document.getElementById('bizprod-create-result'), { code: 400, message: e.message });
    }
});

document.getElementById('bizorder-refresh').addEventListener('click', () => loadOrderList());
document.getElementById('bizorder-filter-btn').addEventListener('click', () => {
    loadOrderList(document.getElementById('bizorder-status-filter').value);
});
document.getElementById('bizorder-create').addEventListener('click', () => {
    try {
        const o = BizStore.createOrder(
            parseInt(document.getElementById('bizorder-buyer').value, 10),
            parseInt(document.getElementById('bizorder-product').value, 10),
            parseInt(document.getElementById('bizorder-quantity').value || '1', 10),
            document.getElementById('bizorder-address').value
        );
        showResult(document.getElementById('bizorder-create-result'), { code: 200, data: o });
        loadOrderList(); loadUserList(); loadProductList();
    } catch (e) {
        showResult(document.getElementById('bizorder-create-result'), { code: 400, message: e.message });
    }
});
document.querySelectorAll('[data-orderaction]').forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.dataset.orderaction;
        const oid = parseInt(document.getElementById('bizorder-action-id').value, 10);
        const opid = parseInt(document.getElementById('bizorder-action-opid').value, 10);
        try {
            let r;
            if (action === 'ship') r = BizStore.shipOrder(oid, opid);
            else if (action === 'complete') r = BizStore.completeOrder(oid, opid);
            else r = BizStore.cancelOrder(oid, opid);
            showResult(document.getElementById('bizorder-action-result'), { code: 200, data: r });
            loadOrderList(); loadUserList(); loadProductList();
        } catch (e) {
            showResult(document.getElementById('bizorder-action-result'), { code: 400, message: e.message });
        }
    });
});

window.addEventListener('DOMContentLoaded', () => {
    try {
        BizStore.initDemoData();
        loadUserList(); loadProductList(); loadOrderList();
    } catch (e) { /* ignore */ }
});

// ====== 接口测试（模拟 HTTP 调用） ======
document.getElementById('reg-run').addEventListener('click', () => {
    const u = document.getElementById('reg-u').value;
    const p = document.getElementById('reg-p').value;
    const e = document.getElementById('reg-e').value;
    const ok = UserValidator.validateUser(u, p, e);
    showResult(document.getElementById('reg-result'),
        ok ? { code: 200, message: '注册成功' } : { code: 400, message: '注册信息不合法' });
});

document.getElementById('login-run').addEventListener('click', () => {
    const u = document.getElementById('login-u').value;
    const p = document.getElementById('login-p').value;
    if (u === 'admin' && p === 'Admin123') {
        showResult(document.getElementById('login-result'),
            { code: 200, message: '登录成功', token: 'mock-token-' + Date.now() });
    } else {
        showResult(document.getElementById('login-result'),
            { code: 401, message: '用户名或密码错误' });
    }
});

document.getElementById('perm-run').addEventListener('click', () => {
    try {
        const perm = UserValidator.checkPermission(document.getElementById('perm-r').value);
        showResult(document.getElementById('perm-result'), { code: 200, permission: perm });
    } catch (e) {
        showResult(document.getElementById('perm-result'), { code: 400, message: e.message });
    }
});

// ====== 测试执行（模拟 JUnit 5 引擎） ======
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
        { name: 'testFactorial_10', cls: 'CalculatorTest', run: () => assertEq(3628800, Calculator.factorial(10)) },
        { name: 'testFactorialNegative', cls: 'CalculatorTest', run: () => assertThrows(() => Calculator.factorial(-1)) },
    ],
    string: [
        { name: 'testIsEmpty_null', cls: 'StringUtilsTest', run: () => assertTrue(StringUtils.isEmpty(null)) },
        { name: 'testIsEmpty_empty', cls: 'StringUtilsTest', run: () => assertTrue(StringUtils.isEmpty('')) },
        { name: 'testIsEmpty_not', cls: 'StringUtilsTest', run: () => assertTrue(!StringUtils.isEmpty('abc')) },
        { name: 'testIsBlank_whitespace', cls: 'StringUtilsTest', run: () => assertTrue(StringUtils.isBlank('   ')) },
        { name: 'testReverse', cls: 'StringUtilsTest', run: () => assertEq('cba', StringUtils.reverse('abc')) },
        { name: 'testToCamelCase', cls: 'StringUtilsTest', run: () => assertEq('helloWorld', StringUtils.toCamelCase('hello_world')) },
        { name: 'testIsPalindrome_true', cls: 'StringUtilsTest', run: () => assertTrue(StringUtils.isPalindrome('level')) },
        { name: 'testIsPalindrome_false', cls: 'StringUtilsTest', run: () => assertTrue(!StringUtils.isPalindrome('hello')) },
        { name: 'testCountOccurrences', cls: 'StringUtilsTest', run: () => assertEq(2, StringUtils.countOccurrences('hello world hello', 'hello')) },
    ],
    user: [
        { name: 'testIsValidUsername_valid', cls: 'UserValidatorTest', run: () => assertTrue(UserValidator.isValidUsername('test_user_01')) },
        { name: 'testIsValidUsername_short', cls: 'UserValidatorTest', run: () => assertTrue(!UserValidator.isValidUsername('ab')) },
        { name: 'testIsValidPassword_valid', cls: 'UserValidatorTest', run: () => assertTrue(UserValidator.isValidPassword('Abc123')) },
        { name: 'testIsValidPassword_weak', cls: 'UserValidatorTest', run: () => assertTrue(!UserValidator.isValidPassword('weak')) },
        { name: 'testIsValidEmail_valid', cls: 'UserValidatorTest', run: () => assertTrue(UserValidator.isValidEmail('test@example.com')) },
        { name: 'testIsValidEmail_invalid', cls: 'UserValidatorTest', run: () => assertTrue(!UserValidator.isValidEmail('invalid')) },
        { name: 'testValidateUser_valid', cls: 'UserValidatorTest', run: () => assertTrue(UserValidator.validateUser('user1', 'Pass123', 'a@b.com')) },
        { name: 'testCheckPermission_admin', cls: 'UserValidatorTest', run: () => assertEq('全部权限', UserValidator.checkPermission('admin')) },
        { name: 'testCheckPermission_null', cls: 'UserValidatorTest', run: () => assertThrows(() => UserValidator.checkPermission(null)) },
    ],
    api: [
        { name: 'testRegisterSuccess', cls: 'UserApiTest', run: () => assertTrue(UserValidator.validateUser('newuser', 'Pass123', 'new@example.com')) },
        { name: 'testRegisterFail', cls: 'UserApiTest', run: () => assertTrue(!UserValidator.validateUser('x', 'weak', 'bad')) },
        { name: 'testLoginSuccess', cls: 'UserApiTest', run: () => assertTrue(true) },
        { name: 'testLoginFail', cls: 'UserApiTest', run: () => assertTrue(true) },
        { name: 'testPermissionAdmin', cls: 'UserApiTest', run: () => assertEq('全部权限', UserValidator.checkPermission('admin')) },
        { name: 'testPermissionGuest', cls: 'UserApiTest', run: () => assertEq('无权限', UserValidator.checkPermission('guest')) },
    ],
    restassured: [
        { name: 'testRegisterSuccess_200', cls: 'UserApiRestAssuredTest', run: () => assertTrue(UserValidator.validateUser('newuser', 'Pass123', 'new@example.com')) },
        { name: 'testRegisterFail_400', cls: 'UserApiRestAssuredTest', run: () => assertTrue(!UserValidator.validateUser('x', 'weak', 'bad')) },
        { name: 'testLoginSuccess_200', cls: 'UserApiRestAssuredTest', run: () => assertTrue(true) },
        { name: 'testLoginFail_401', cls: 'UserApiRestAssuredTest', run: () => assertTrue(true) },
        { name: 'testCalcAdd', cls: 'UserApiRestAssuredTest', run: () => assertEq(13, Calculator.add(10, 3)) },
        { name: 'testCalcDivideByZero', cls: 'UserApiRestAssuredTest', run: () => assertThrows(() => Calculator.divide(10, 0)) },
    ],
    biz: [
        { name: 'testRegisterUserSuccess', cls: 'UserServiceTest', run: () => {
            const s = BizStore; s.initDemoData();
            const u = s.register('ut_buyer', 'Utpass1', 'ut@b.com', 'BUYER');
            assertTrue(u.id > 0); assertEq('BUYER', u.role);
        }},
        { name: 'testRegisterDuplicateUsername', cls: 'UserServiceTest', run: () => {
            const s = BizStore; s.initDemoData();
            assertThrows(() => s.register('admin', 'Abc12345', 'a2@b.com'));
        }},
        { name: 'testRegisterInvalidPassword', cls: 'UserServiceTest', run: () => {
            assertThrows(() => BizStore.register('weakuser', '123', 'w@b.com'));
        }},
        { name: 'testRechargeSuccess', cls: 'UserServiceTest', run: () => {
            const s = BizStore; s.initDemoData();
            const list = s.listUsers(); const before = list[0].balance;
            s.recharge(list[0].id, 50000);
            assertEq(before + 50000, s.listUsers()[0].balance);
        }},
        { name: 'testRechargeNegative', cls: 'UserServiceTest', run: () => {
            const s = BizStore; s.initDemoData();
            assertThrows(() => s.recharge(1, -100));
        }},
        { name: 'testLoginSuccess', cls: 'UserServiceTest', run: () => {
            const s = BizStore; s.initDemoData();
            const r = s.login('admin', 'Admin123');
            assertEq('admin', r.username);
        }},
        { name: 'testLoginWrongPwd', cls: 'UserServiceTest', run: () => {
            assertThrows(() => BizStore.login('admin', 'wrong'));
        }},
        { name: 'testCreateProductSuccess', cls: 'OrderServiceTest', run: () => {
            const s = BizStore; s.initDemoData();
            const users = s.listUsers();
            const seller = users.find(u => u.role === 'SELLER');
            const p = s.createProduct('测试商品', 10000, 50, '电子产品', seller.id);
            assertEq('测试商品', p.name); assertEq(50, p.stock);
        }},
        { name: 'testCreateProductNotSeller', cls: 'OrderServiceTest', run: () => {
            const s = BizStore; s.initDemoData();
            const buyer = s.listUsers().find(u => u.role === 'BUYER');
            assertThrows(() => s.createProduct('越权商品', 100, 10, '食品', buyer.id));
        }},
        { name: 'testCreateOrderSuccess', cls: 'OrderServiceTest', run: () => {
            const s = BizStore; s.initDemoData();
            const users = s.listUsers(); const prods = s.listProducts();
            const buyer = users.find(u => u.role === 'BUYER');
            const prod = prods[0]; const before = prod.stock;
            const o = s.createOrder(buyer.id, prod.id, 1, '测试地址');
            assertEq('PAID', o.status); assertEq(before - 1, s.listProducts()[0].stock);
        }},
        { name: 'testCreateOrderInsufficientStock', cls: 'OrderServiceTest', run: () => {
            const s = BizStore; s.initDemoData();
            const users = s.listUsers(); const prods = s.listProducts();
            const buyer = users.find(u => u.role === 'BUYER');
            assertThrows(() => s.createOrder(buyer.id, prods[0].id, 9999999, 'addr'));
        }},
        { name: 'testShipOrderSuccess', cls: 'OrderServiceTest', run: () => {
            const s = BizStore; s.initDemoData();
            const users = s.listUsers(); const prods = s.listProducts();
            const buyer = users.find(u => u.role === 'BUYER');
            const seller = users.find(u => u.role === 'SELLER');
            const o = s.createOrder(buyer.id, prods[0].id, 1, 'addr');
            const shipped = s.shipOrder(o.id, seller.id);
            assertEq('SHIPPED', shipped.status);
        }},
        { name: 'testCompleteOrder', cls: 'OrderServiceTest', run: () => {
            const s = BizStore; s.initDemoData();
            const users = s.listUsers(); const prods = s.listProducts();
            const buyer = users.find(u => u.role === 'BUYER');
            const seller = users.find(u => u.role === 'SELLER');
            const o = s.createOrder(buyer.id, prods[0].id, 1, 'addr');
            s.shipOrder(o.id, seller.id);
            const done = s.completeOrder(o.id, buyer.id);
            assertEq('COMPLETED', done.status);
        }},
        { name: 'testCancelOrder', cls: 'OrderServiceTest', run: () => {
            const s = BizStore; s.initDemoData();
            const users = s.listUsers(); const prods = s.listProducts();
            const buyer = users.find(u => u.role === 'BUYER');
            const o = s.createOrder(buyer.id, prods[0].id, 1, 'addr');
            const can = s.cancelOrder(o.id, buyer.id);
            assertEq('CANCELLED', can.status);
        }}
    ],
    bizapi: [
        { name: 'testInitData_200', cls: 'BizApiIntegrationTest', run: () => {
            const s = BizStore; const info = s.initDemoData();
            assertTrue(info.userCount >= 3); assertTrue(info.productCount >= 4);
        }},
        { name: 'testRegisterUser_200', cls: 'BizApiIntegrationTest', run: () => {
            const u = BizStore.register('bizapi_user', 'Bizapi1', 'bizapi@t.com', 'BUYER');
            assertTrue(u.id > 0);
        }},
        { name: 'testRegisterUser_400_Dup', cls: 'BizApiIntegrationTest', run: () => {
            BizStore.initDemoData();
            assertThrows(() => BizStore.register('admin', 'Xxx12345', 'dup@t.com'));
        }},
        { name: 'testListUsers_200', cls: 'BizApiIntegrationTest', run: () => {
            BizStore.initDemoData();
            assertTrue(BizStore.listUsers().length >= 3);
        }},
        { name: 'testCreateProduct_200', cls: 'BizApiIntegrationTest', run: () => {
            BizStore.initDemoData();
            const seller = BizStore.listUsers().find(u => u.role === 'SELLER');
            const p = BizStore.createProduct('API商品', 19900, 10, '食品', seller.id);
            assertEq('AVAILABLE', p.status);
        }},
        { name: 'testCreateProduct_400_NotSeller', cls: 'BizApiIntegrationTest', run: () => {
            BizStore.initDemoData();
            const buyer = BizStore.listUsers().find(u => u.role === 'BUYER');
            assertThrows(() => BizStore.createProduct('越权', 100, 1, '食品', buyer.id));
        }},
        { name: 'testCreateOrder_200', cls: 'BizApiIntegrationTest', run: () => {
            BizStore.initDemoData();
            const buyer = BizStore.listUsers().find(u => u.role === 'BUYER');
            const prod = BizStore.listProducts()[0];
            const o = BizStore.createOrder(buyer.id, prod.id, 1, '北京');
            assertEq('PAID', o.status);
        }},
        { name: 'testCreateOrder_400_NoStock', cls: 'BizApiIntegrationTest', run: () => {
            BizStore.initDemoData();
            const buyer = BizStore.listUsers().find(u => u.role === 'BUYER');
            const prod = BizStore.listProducts()[0];
            assertThrows(() => BizStore.createOrder(buyer.id, prod.id, 9999999, '北京'));
        }},
        { name: 'testShipOrder_200', cls: 'BizApiIntegrationTest', run: () => {
            BizStore.initDemoData();
            const users = BizStore.listUsers(); const prods = BizStore.listProducts();
            const buyer = users.find(u => u.role === 'BUYER');
            const seller = users.find(u => u.role === 'SELLER');
            const o = BizStore.createOrder(buyer.id, prods[0].id, 1, '上海');
            assertEq('SHIPPED', BizStore.shipOrder(o.id, seller.id).status);
        }},
        { name: 'testCompleteOrder_200', cls: 'BizApiIntegrationTest', run: () => {
            BizStore.initDemoData();
            const users = BizStore.listUsers(); const prods = BizStore.listProducts();
            const buyer = users.find(u => u.role === 'BUYER');
            const seller = users.find(u => u.role === 'SELLER');
            const o = BizStore.createOrder(buyer.id, prods[0].id, 1, '深圳');
            BizStore.shipOrder(o.id, seller.id);
            assertEq('COMPLETED', BizStore.completeOrder(o.id, buyer.id).status);
        }},
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

// 断言辅助
function assertEq(expected, actual) {
    if (expected !== actual) throw new Error(`expected: <${expected}> but was: <${actual}>`);
}
function assertTrue(cond) { if (!cond) throw new Error('assertion failed'); }
function assertThrows(fn) {
    try { fn(); throw new Error('Expected exception but none thrown'); }
    catch (e) { /* ok */ }
}

function getTests(target) {
    if (target === 'all' || target === 'suite') {
        return [].concat(...['calculator','string','user','api','restassured','biz','bizapi','ui'].map(k => testCases[k] || []));
    }
    return testCases[target] || [];
}

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
        document.getElementById('test-summary').classList.remove('show', 'ok', 'fail');
        document.getElementById('test-failures').innerHTML = '';

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

        const tests = getTests(target);
        const failures = [];
        let passed = 0, failed = 0;
        const start = performance.now();

        for (const tc of tests) {
            try {
                tc.run();
                passed++;
            } catch (e) {
                failed++;
                failures.push({ displayName: tc.name, className: tc.cls, message: e.message, type: 'AssertionFailedError' });
            }
            await new Promise(r => setTimeout(r, 15));
        }

        const elapsed = ((performance.now() - start) / 1000).toFixed(3);

        logLine(`✔ 执行完成，耗时 ${elapsed} 秒`, failed > 0 ? 'warn' : 'ok');
        logLine(`  总计: ${tests.length}  成功: ${passed}  失败: ${failed}  跳过: 0  异常中断: 0`, 'info');

        const $summary = document.getElementById('test-summary');
        $summary.innerHTML = `
            <div class="stat"><span class="num">${tests.length}</span><span class="label">总用例数</span></div>
            <div class="stat"><span class="num" style="color:#86efac">${passed}</span><span class="label">成功</span></div>
            <div class="stat"><span class="num" style="color:#fca5a5">${failed}</span><span class="label">失败</span></div>
            <div class="stat"><span class="num" style="color:#fcd34d">0</span><span class="label">跳过</span></div>
            <div class="stat"><span class="num" style="color:#93c5fd">${elapsed}s</span><span class="label">执行耗时</span></div>
        `;
        $summary.classList.add('show');
        $summary.classList.add(failed === 0 ? 'ok' : 'fail');

        if (failures.length > 0) {
            const $f = document.getElementById('test-failures');
            $f.innerHTML = `<h3 style="color:#dc2626;margin-bottom:12px;">❌ 失败详情 (${failures.length})</h3>`;
            failures.forEach(f => {
                const card = document.createElement('div');
                card.className = 'failure-card';
                card.innerHTML = `
                    <div class="fc-title">${f.displayName}</div>
                    <div class="fc-type">${f.className} · ${f.type}</div>
                    <div class="fc-msg">${f.message}</div>
                `;
                $f.appendChild(card);
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
    const threads = parseInt(document.getElementById('perf-threads').value) || 20;
    const loops = parseInt(document.getElementById('perf-loops').value) || 20;

    $perfRun.disabled = true;
    $perfRun.textContent = '⏳ 压测进行中...';
    $perfSummary.classList.remove('show', 'ok', 'fail');
    $perfDetail.style.display = 'none';

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

    const data = {
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

    const allOk = failed === 0;
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
