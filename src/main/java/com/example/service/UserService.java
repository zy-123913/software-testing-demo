package com.example.service;

import com.example.dao.TransactionLogDao;
import com.example.dao.UserDao;
import com.example.entity.TransactionLog;
import com.example.entity.User;
import com.example.common.BusinessException;

import java.util.Collections;
import java.util.List;
import java.util.regex.Pattern;

/**
 * 用户服务：注册、登录、查询、权限校验、余额变动 + 账户流水
 *
 * 设计要点：
 *  - 依赖 UserDao 接口（面向接口编程，便于 Service 单元测试用 Mockito 打桩）
 *  - TransactionLogDao 可选（为 null 时不记录流水，兼容老构造）
 *  - 所有参数校验在 Service 层完成，非法输入统一抛出 BusinessException
 */
public class UserService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final UserDao userDao;
    private final TransactionLogDao txLogDao; // nullable

    /** 兼容旧版构造（无流水，用于单测/历史代码） */
    public UserService(UserDao userDao) {
        this(userDao, null);
    }

    /** 新版构造：同时注入流水 DAO */
    public UserService(UserDao userDao, TransactionLogDao txLogDao) {
        this.userDao = userDao;
        this.txLogDao = txLogDao;
    }

    /**
     * 注册用户（用户名忽略大小写 + 空格 查重，邮箱格式校验）
     */
    public User register(String username, String password, String email, String role) {
        if (username == null || username.trim().length() < 3 || username.trim().length() > 32) {
            throw new BusinessException("用户名长度必须在 3-32 之间");
        }
        String cleanName = username.trim();
        if (password == null || password.length() < 6 || !password.matches(".*[A-Z].*") || !password.matches(".*\\d.*")) {
            throw new BusinessException("密码至少 6 位，且包含大写字母和数字");
        }
        if (email == null || !EMAIL_PATTERN.matcher(email.trim()).matches()) {
            throw new BusinessException("邮箱格式不合法");
        }
        if (role == null || (!role.equals("ADMIN") && !role.equals("BUYER") && !role.equals("SELLER"))) {
            throw new BusinessException("角色必须是 ADMIN/BUYER/SELLER");
        }
        // 忽略大小写/前后空格查重：admin/Admin/ ADMIN 视为重复
        if (userDao.findByUsernameIgnoreCase(cleanName).isPresent()) {
            throw new BusinessException("用户名已存在");
        }
        User u = new User(null, cleanName, password, email.trim(), role);
        return userDao.save(u);
    }

    /**
     * 登录校验
     */
    public User login(String username, String password) {
        if (username == null || password == null) {
            throw new BusinessException(401, "用户名或密码不能为空");
        }
        java.util.Optional<User> byName = userDao.findByUsername(username);
        User u = byName.isPresent() ? byName.get()
                : userDao.findByUsernameIgnoreCase(username)
                        .orElseThrow(() -> new BusinessException(401, "用户名或密码错误"));
        if (u.getStatus() == null || u.getStatus() != 1) {
            throw new BusinessException(403, "账号已被禁用");
        }
        if (!password.equals(u.getPassword())) {
            throw new BusinessException(401, "用户名或密码错误");
        }
        return u;
    }

    public User getById(Long id) {
        if (id == null) throw new BusinessException("用户 ID 不能为空");
        return userDao.findById(id)
                .orElseThrow(() -> new BusinessException(404, "用户不存在"));
    }

    public List<User> listAll() {
        return userDao.findAll();
    }

    public List<User> listByRole(String role) {
        if (role == null) throw new BusinessException("角色不能为空");
        return userDao.findByRole(role);
    }

    /** 启用/禁用用户（管理员操作） */
    public boolean setStatus(Long id, Integer status, Long operatorId) {
        if (operatorId == null) throw new BusinessException(403, "无操作权限");
        User op = userDao.findById(operatorId)
                .orElseThrow(() -> new BusinessException(403, "无操作权限"));
        if (!"ADMIN".equals(op.getRole())) throw new BusinessException(403, "仅管理员可修改用户状态");
        if (status != 0 && status != 1) throw new BusinessException("状态值不合法");
        User u = getById(id);
        u.setStatus(status);
        userDao.save(u);
        return true;
    }

    // ================= 余额变动（写流水） =================

    /** 扣减余额（下单时调用） */
    public boolean deductBalance(Long userId, int amount) {
        return deductBalance(userId, amount, "PAY", null, "订单消费");
    }

    /** 扣减余额（支持流水类型/订单号/备注） */
    public boolean deductBalance(Long userId, int amount, String type, String refNo, String remark) {
        if (amount <= 0) throw new BusinessException("扣款金额必须为正");
        User u = getById(userId);
        if (u.getBalance() == null || u.getBalance() < amount) {
            throw new BusinessException("余额不足");
        }
        long newBal = u.getBalance() - amount;
        u.setBalance(newBal);
        userDao.save(u);
        writeTx(userId, type == null ? "PAY" : type, -amount, newBal, refNo, remark);
        return true;
    }

    /** 余额充值（默认类型 RECHARGE） */
    public Long recharge(Long userId, int amount) {
        return recharge(userId, amount, "RECHARGE", null, "账户充值");
    }

    /** 余额充值（自定义流水类型/订单号/备注：用于取消订单回余额等场景） */
    public Long recharge(Long userId, int amount, String type, String refNo, String remark) {
        if (amount <= 0) throw new BusinessException("充值金额必须为正");
        User u = getById(userId);
        long newBal = (u.getBalance() == null ? 0 : u.getBalance()) + amount;
        u.setBalance(newBal);
        userDao.save(u);
        writeTx(userId, type == null ? "RECHARGE" : type, amount, newBal, refNo, remark);
        return newBal;
    }

    /** 查询账户流水（按时间倒序） */
    public List<TransactionLog> listTransactions(Long userId) {
        if (userId == null) throw new BusinessException("用户 ID 不能为空");
        getById(userId); // 校验用户存在
        if (txLogDao == null) return Collections.emptyList();
        return txLogDao.findByUserId(userId);
    }

    // ================= 内部工具 =================

    private void writeTx(Long userId, String type, int amount, long balanceAfter, String refNo, String remark) {
        if (txLogDao == null) return;
        txLogDao.save(new TransactionLog(userId, type, amount, balanceAfter, refNo, remark));
    }
}
