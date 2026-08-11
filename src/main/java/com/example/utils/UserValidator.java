package com.example.utils;

import java.util.regex.Pattern;

/**
 * 用户校验工具类，提供用户名、密码、邮箱校验及权限检查。
 */
public class UserValidator {

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_]{3,20}$");
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{6,20}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$");

    public boolean isValidUsername(String username) {
        return username != null && USERNAME_PATTERN.matcher(username).matches();
    }

    public boolean isValidPassword(String password) {
        return password != null && PASSWORD_PATTERN.matcher(password).matches();
    }

    public boolean isValidEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email).matches();
    }

    public boolean validateUser(String username, String password, String email) {
        return isValidUsername(username) && isValidPassword(password) && isValidEmail(email);
    }

    public String checkPermission(String role) {
        if (role == null) {
            throw new IllegalArgumentException("角色不能为空");
        }
        switch (role.toLowerCase()) {
            case "admin":
                return "全部权限";
            case "editor":
                return "编辑权限";
            case "viewer":
                return "只读权限";
            default:
                return "无权限";
        }
    }
}
