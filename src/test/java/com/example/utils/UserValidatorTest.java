package com.example.utils;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 用户校验工具类单元测试。
 */
@DisplayName("用户校验工具类测试")
class UserValidatorTest {

    private UserValidator validator;

    @BeforeEach
    void setUp() {
        validator = new UserValidator();
    }

    @ParameterizedTest(name = "用户名: \"{0}\" -> {1}")
    @DisplayName("用户名校验测试")
    @CsvSource({
            "user_01, true",
            "ab, false",
            "validUser123, true",
            "invalid-user, false",
            "toolongusername1234567890, false",
            ", false"
    })
    void testIsValidUsername(String username, boolean expected) {
        assertEquals(expected, validator.isValidUsername(username));
    }

    @ParameterizedTest(name = "密码: \"{0}\" -> {1}")
    @DisplayName("密码校验测试")
    @CsvSource({
            "Abc123, true",
            "abc123, false",
            "ABC123, false",
            "Abcdefg, false",
            "A1b, false",
            ", false"
    })
    void testIsValidPassword(String password, boolean expected) {
        assertEquals(expected, validator.isValidPassword(password));
    }

    @ParameterizedTest(name = "邮箱: \"{0}\" -> {1}")
    @DisplayName("邮箱校验测试")
    @CsvSource({
            "test@example.com, true",
            "invalid-email, false",
            "user@domain, false",
            "a@b.com, true",
            ", false"
    })
    void testIsValidEmail(String email, boolean expected) {
        assertEquals(expected, validator.isValidEmail(email));
    }

    @Test
    @DisplayName("完整用户校验测试 - 合法")
    void testValidateUserValid() {
        assertTrue(validator.validateUser("testuser", "Pass123", "test@example.com"));
    }

    @Test
    @DisplayName("完整用户校验测试 - 非法")
    void testValidateUserInvalid() {
        assertFalse(validator.validateUser("x", "weak", "not-email"));
    }

    @ParameterizedTest(name = "角色: \"{0}\" -> {1}")
    @DisplayName("权限检查测试")
    @CsvSource({
            "admin, 全部权限",
            "editor, 编辑权限",
            "viewer, 只读权限",
            "guest, 无权限"
    })
    void testCheckPermission(String role, String expected) {
        assertEquals(expected, validator.checkPermission(role));
    }

    @Test
    @DisplayName("空角色权限检查应抛出异常")
    void testCheckPermissionNull() {
        assertThrows(IllegalArgumentException.class, () -> validator.checkPermission(null));
    }

    @AfterEach
    void tearDown() {
        validator = null;
    }
}
