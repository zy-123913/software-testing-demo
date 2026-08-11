package com.example.utils;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 计算器工具类单元测试。
 */
@DisplayName("计算器工具类测试")
class CalculatorTest {

    private Calculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new Calculator();
    }

    @Test
    @DisplayName("加法运算测试")
    void testAdd() {
        assertEquals(5, calculator.add(2, 3));
        assertEquals(-1, calculator.add(2, -3));
        assertEquals(0, calculator.add(0, 0));
    }

    @Test
    @DisplayName("减法运算测试")
    void testSubtract() {
        assertEquals(1, calculator.subtract(3, 2));
        assertEquals(5, calculator.subtract(2, -3));
        assertEquals(0, calculator.subtract(0, 0));
    }

    @Test
    @DisplayName("乘法运算测试")
    void testMultiply() {
        assertEquals(6, calculator.multiply(2, 3));
        assertEquals(-6, calculator.multiply(2, -3));
        assertEquals(0, calculator.multiply(0, 100));
    }

    @Test
    @DisplayName("除法运算测试")
    void testDivide() {
        assertEquals(2.5, calculator.divide(5, 2));
        assertEquals(-2.0, calculator.divide(6, -3));
    }

    @Test
    @DisplayName("除数为零应抛出异常")
    void testDivideByZero() {
        ArithmeticException ex = assertThrows(
                ArithmeticException.class, () -> calculator.divide(5, 0));
        assertEquals("除数不能为零", ex.getMessage());
    }

    @ParameterizedTest(name = "质数判断: {0} 应为质数")
    @DisplayName("质数判断参数化测试 - 质数")
    @ValueSource(ints = {2, 3, 5, 7, 11, 13})
    void testIsPrimeTrue(int n) {
        assertTrue(calculator.isPrime(n));
    }

    @ParameterizedTest(name = "非质数判断: {0} 应为非质数")
    @DisplayName("非质数判断参数化测试")
    @ValueSource(ints = {0, 1, 4, 6, 8, 9, 10})
    void testIsPrimeFalse(int n) {
        assertFalse(calculator.isPrime(n));
    }

    @ParameterizedTest(name = "阶乘: {0}! = {1}")
    @DisplayName("阶乘运算参数化测试")
    @CsvSource({"0, 1", "1, 1", "5, 120", "10, 3628800"})
    void testFactorial(int n, long expected) {
        assertEquals(expected, calculator.factorial(n));
    }

    @Test
    @DisplayName("负数阶乘应抛出异常")
    void testFactorialNegative() {
        assertThrows(IllegalArgumentException.class, () -> calculator.factorial(-1));
    }

    @AfterEach
    void tearDown() {
        calculator = null;
    }
}
