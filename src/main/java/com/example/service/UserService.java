package com.example.service;

import com.example.dao.UserDao;
import com.example.entity.User;
import com.example.common.BusinessException;

import java.util.List;
import java.util.regex.Pattern;

/**
 * 用户服务：注册、登录、查询、权限校验、余额变动
 *
 * 设计要点：
 *  - 依赖 UserDao 接口（面向接口编程，便于 Service 单元测试用 Mockito 打桩）
 *  - 所有参数校验在 Service 层完成，不依赖 Controller
 *  - 非法输入统一抛出 BusinessException，由上层统一转为 JSON 错误响应
 */
public class UserService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final UserDao userDao;

    public UserService(UserDao userDao) {
        this.userDao = userDao;
    }

    /**
     * 注册用户
     * @return 注册成功后的用户（含 ID）
     */
    public User register(String username, String password, String email, String role) {
        if (username == null || username.length() < 3 || username.length() > 32) {
            throw new BusinessException("用户名长度必须在 3-32 之间");
        }
        if (password == null || password.length() < 6 || !password.matches(".*[A-Z].*") || !password.matches(".*\\d.*")) {
            throw new BusinessException("密码至少 6 位，且包含大写字母和数字");
        }
        if (email == null || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new BusinessException("邮箱格式不合法");
        }
        if (role == null || (!role.equals("ADMIN") && !role.equals("BUYER") && !role.equals("SELLER"))) {
            throw new BusinessException("角色必须是 ADMIN/BUYER/SELLER");
        }
        if (userDao.findByUsername(username).isPresent()) {
            throw new BusinessException("用户名已存在");
        }
        User u = new User(null, username, password, email, role);
        return userDao.save(u);
    }

    /**
     * 登录校验
     * @return 登录成功返回用户对象
     */
    public User login(String username, String password) {
        if (username == null || password == null) {
            throw new BusinessException(401, "用户名或密码不能为空");
        }
        User u = userDao.findByUsername(username)
                .orElseThrow(() -> new BusinessException(401, "用户名或密码错误"));
        if (u.getStatus() == null || u.getStatus() != 1) {
            throw new BusinessException(403, "账号已被禁用");
        }
        if (!password.equals(u.getPassword())) {
            throw new BusinessException(401, "用户名或密码错误");
        }
        return u;
    }

    /** 根据 ID 查询 */
    public User getById(Long id) {
        if (id == null) throw new BusinessException("用户 ID 不能为空");
        return userDao.findById(id)
                .orElseThrow(() -> new BusinessException(404, "用户不存在"));
    }

    /** 查询全部用户 */
    public List<User> listAll() {
        return userDao.findAll();
    }

    /** 按角色查询 */
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

    /** 扣减余额（下单时调用） */
    public boolean deductBalance(Long userId, int amount) {
        if (amount <= 0) throw new BusinessException("扣款金额必须为正");
        User u = getById(userId);
        if (u.getBalance() == null || u.getBalance() < amount) {
            throw new BusinessException("余额不足");
        }
        u.setBalance(u.getBalance() - amount);
        userDao.save(u);
        return true;
    }

    /** 余额充值 */
    public Long recharge(Long userId, int amount) {
        if (amount <= 0) throw new BusinessException("充值金额必须为正");
        User u = getById(userId);
        long newBal = (u.getBalance() == null ? 0 : u.getBalance()) + amount;
        u.setBalance(newBal);
        userDao.save(u);
        return newBal;
    }
}
