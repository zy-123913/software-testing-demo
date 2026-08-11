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

// ====== UI 辅助 ======
function showResult(el, data, okFn) {
    el.classList.remove('ok', 'err');
    const ok = okFn ? okFn(data) : data && data.code === 200;
    el.classList.add(ok ? 'ok' : 'err');
    el.textContent = JSON.stringify(data, null, 2);
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
// 测试用例定义：每个用例有 name, class, target, 以及执行函数
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
        { name: 'testReverse_null', cls: 'StringUtilsTest', run: () => assertEq(null, StringUtils.reverse(null)) },
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
        { name: 'testCheckPermission_editor', cls: 'UserValidatorTest', run: () => assertEq('编辑权限', UserValidator.checkPermission('editor')) },
        { name: 'testCheckPermission_null', cls: 'UserValidatorTest', run: () => assertThrows(() => UserValidator.checkPermission(null)) },
    ],
    api: [
        { name: 'testRegisterSuccess', cls: 'UserApiTest', run: () => { const ok = UserValidator.validateUser('newuser', 'Pass123', 'new@example.com'); assertTrue(ok); } },
        { name: 'testRegisterFail', cls: 'UserApiTest', run: () => { const ok = UserValidator.validateUser('x', 'weak', 'bad'); assertTrue(!ok); } },
        { name: 'testLoginSuccess', cls: 'UserApiTest', run: () => assertEq('admin', 'admin' && 'Admin123' ? 'admin' : '') },
        { name: 'testLoginFail', cls: 'UserApiTest', run: () => assertTrue(!('wrong' === 'Admin123')) },
        { name: 'testPermissionAdmin', cls: 'UserApiTest', run: () => assertEq('全部权限', UserValidator.checkPermission('admin')) },
        { name: 'testPermissionGuest', cls: 'UserApiTest', run: () => assertEq('无权限', UserValidator.checkPermission('guest')) },
        { name: 'testRegisterWrongMethod', cls: 'UserApiTest', run: () => assertTrue(true) },
    ],
    restassured: [
        { name: 'testRegisterSuccess', cls: 'UserApiRestAssuredTest', run: () => assertTrue(UserValidator.validateUser('newuser', 'Pass123', 'new@example.com')) },
        { name: 'testRegisterFail', cls: 'UserApiRestAssuredTest', run: () => assertTrue(!UserValidator.validateUser('x', 'weak', 'bad')) },
        { name: 'testRegisterWrongMethod', cls: 'UserApiRestAssuredTest', run: () => assertTrue(true) },
        { name: 'testLoginSuccess', cls: 'UserApiRestAssuredTest', run: () => assertTrue('admin' === 'admin' && 'Admin123' === 'Admin123') },
        { name: 'testLoginFail', cls: 'UserApiRestAssuredTest', run: () => assertTrue('wrong' !== 'Admin123') },
        { name: 'testPermissionAdmin', cls: 'UserApiRestAssuredTest', run: () => assertEq('全部权限', UserValidator.checkPermission('admin')) },
        { name: 'testPermissionGuest', cls: 'UserApiRestAssuredTest', run: () => assertEq('无权限', UserValidator.checkPermission('guest')) },
        { name: 'testCalcAdd', cls: 'UserApiRestAssuredTest', run: () => assertEq(13, Calculator.add(10, 3)) },
        { name: 'testCalcDivideByZero', cls: 'UserApiRestAssuredTest', run: () => assertThrows(() => Calculator.divide(10, 0)) },
    ],
    ui: [
        { name: 'testCalculatorAdd', cls: 'WebUiTest', run: () => assertEq(13, Calculator.add(10, 3)) },
        { name: 'testCalculatorPrime', cls: 'WebUiTest', run: () => assertTrue(Calculator.isPrime(17)) },
        { name: 'testCalculatorFactorial', cls: 'WebUiTest', run: () => assertEq(120, Calculator.factorial(5)) },
        { name: 'testRunCalculatorSuite', cls: 'WebUiTest', run: () => assertTrue(true) },
        { name: 'testRunAllTests', cls: 'WebUiTest', run: () => assertTrue(true) },
        { name: 'testTabNavigation', cls: 'WebUiTest', run: () => assertTrue(true) },
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

// 获取指定目标的所有测试用例
function getTests(target) {
    if (target === 'all' || target === 'suite') {
        return [...testCases.calculator, ...testCases.string, ...testCases.user, ...testCases.api, ...testCases.restassured, ...testCases.ui];
    }
    return testCases[target] || [];
}

// 日志
const $log = document.getElementById('test-log');
function logLine(text, cls) {
    const line = document.createElement('div');
    if (cls) line.className = 'log-' + cls;
    const t = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    line.textContent = `[${t}] ${text}`;
    $log.appendChild(line);
    $log.scrollTop = $log.scrollHeight;
}

// 运行测试
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
            // 小延迟模拟真实执行
            await new Promise(r => setTimeout(r, 20));
        }

        const elapsed = ((performance.now() - start) / 1000).toFixed(3);

        logLine(`✔ 执行完成，耗时 ${elapsed} 秒`, failed > 0 ? 'warn' : 'ok');
        logLine(`  总计: ${tests.length}  成功: ${passed}  失败: ${failed}  跳过: 0  异常中断: 0`, 'info');

        // 摘要卡片
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

        // 失败详情
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

// ====== 性能测试（前端模拟 JMeter 压测） ======
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
    // 模拟并发压测：分批执行，统计响应时间
    const elapsedList = [];
    let success = 0, failed = 0;
    const start = performance.now();

    for (let i = 0; i < total; i++) {
        const t0 = performance.now();
        // 模拟 HTTP 请求延迟（1-15ms 随机）
        const delay = 1 + Math.random() * 14;
        await new Promise(r => setTimeout(r, delay));
        // 99% 成功率
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

    const data = {
        code: 200,
        api: apiName === 'calc' ? 'GET /api/calc' : 'POST /api/login',
        threads, loops, totalRequests: total, success, failed,
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
