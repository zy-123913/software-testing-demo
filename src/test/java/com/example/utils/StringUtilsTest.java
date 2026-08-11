package com.example.utils;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 字符串处理工具类单元测试。
 */
@DisplayName("字符串处理工具类测试")
class StringUtilsTest {

    private StringUtils stringUtils;

    @BeforeEach
    void setUp() {
        stringUtils = new StringUtils();
    }

    @Test
    @DisplayName("空字符串判断测试")
    void testIsEmpty() {
        assertTrue(stringUtils.isEmpty(null));
        assertTrue(stringUtils.isEmpty(""));
        assertFalse(stringUtils.isEmpty(" "));
        assertFalse(stringUtils.isEmpty("abc"));
    }

    @Test
    @DisplayName("空白字符串判断测试")
    void testIsBlank() {
        assertTrue(stringUtils.isBlank(null));
        assertTrue(stringUtils.isBlank(""));
        assertTrue(stringUtils.isBlank("   "));
        assertFalse(stringUtils.isBlank("abc"));
    }

    @ParameterizedTest(name = "反转: \"{0}\" -> \"{1}\"")
    @DisplayName("字符串反转测试")
    @CsvSource({"abc, cba", "hello, olleh", "12345, 54321", "a, a"})
    void testReverse(String input, String expected) {
        assertEquals(expected, stringUtils.reverse(input));
    }

    @Test
    @DisplayName("null 字符串反转测试")
    void testReverseNull() {
        assertNull(stringUtils.reverse(null));
    }

    @ParameterizedTest(name = "驼峰转换: \"{0}\" -> \"{1}\"")
    @DisplayName("驼峰转换测试")
    @CsvSource({"hello_world, helloWorld", "user-name, userName", "foo bar, fooBar", "already, already"})
    void testToCamelCase(String input, String expected) {
        assertEquals(expected, stringUtils.toCamelCase(input));
    }

    @Test
    @DisplayName("子串计数测试")
    void testCountOccurrences() {
        assertEquals(2, stringUtils.countOccurrences("hello world hello", "hello"));
        assertEquals(0, stringUtils.countOccurrences("abc", "xyz"));
        assertEquals(0, stringUtils.countOccurrences("abc", ""));
        // 非重叠计数：aaaa 中 aa 出现在下标 0 和 2，共 2 次
        assertEquals(2, stringUtils.countOccurrences("aaaa", "aa"));
    }

    @ParameterizedTest(name = "回文: \"{0}\" -> {1}")
    @DisplayName("回文判断测试")
    @CsvSource({"level, true", "A man a plan a canal Panama, true", "hello, false", "noon, true"})
    void testIsPalindrome(String input, boolean expected) {
        assertEquals(expected, stringUtils.isPalindrome(input));
    }

    @AfterEach
    void tearDown() {
        stringUtils = null;
    }
}
