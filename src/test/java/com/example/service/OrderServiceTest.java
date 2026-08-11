package com.example.service;

import com.example.dao.OrderDao;
import com.example.dao.ProductDao;
import com.example.dao.UserDao;
import com.example.entity.Order;
import com.example.entity.Product;
import com.example.entity.User;
import com.example.common.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * 订单服务单元测试
 *  - 重点覆盖事务链路（扣库存→扣余额→创建订单）与异常回滚
 *  - Mockito InOrder 验证调用顺序
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("订单服务单元测试")
class OrderServiceTest {

    @Mock private OrderDao orderDao;
    @Mock private UserDao userDao;
    @Mock private ProductDao productDao;
    @InjectMocks private UserService userService;
    @InjectMocks private ProductService productService;

    private OrderService orderService;

    private User buyer;
    private User seller;
    private User admin;
    private Product phone;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(orderDao, userService, productService);

        buyer = new User(1L, "buyer01", "Buyer123", "b@x.com", "BUYER");
        buyer.setBalance(1_000_000L); // 10000 元
        buyer.setStatus(1);

        seller = new User(2L, "seller01", "Seller123", "s@x.com", "SELLER");
        seller.setStatus(1);

        admin = new User(9L, "admin", "Admin123", "a@x.com", "ADMIN");
        admin.setStatus(1);

        phone = new Product(100L, "iPhone 15", 699_900, 10, "电子产品", 2L);
        phone.setStatus(1);

        when(userDao.findById(1L)).thenReturn(Optional.of(buyer));
        when(userDao.findById(2L)).thenReturn(Optional.of(seller));
        when(userDao.findById(9L)).thenReturn(Optional.of(admin));
        when(productDao.findById(100L)).thenReturn(Optional.of(phone));
    }

    // ====== 创建订单 ======
    @Nested
    @DisplayName("创建订单（事务链路）")
    class CreateOrder {

        @Test
        @DisplayName("下单成功：扣库存→扣余额→创建订单 顺序执行")
        void createSuccess() {
            when(productDao.deductStock(100L, 1)).thenReturn(true);
            when(userDao.save(any(User.class))).thenReturn(buyer);
            when(orderDao.save(any(Order.class))).thenAnswer(inv -> {
                Order o = inv.getArgument(0);
                o.setId(3001L);
                return o;
            });

            Order o = orderService.create(1L, 100L, 1, "上海市浦东新区 xxx 街道");

            assertNotNull(o.getId());
            assertEquals("PAID", o.getStatus());
            assertEquals(300_100, buyer.getBalance()); // 100万 - 699900 = 300100
            assertNotNull(o.getOrderNo());
            assertTrue(o.getOrderNo().startsWith("NO"));

            // 验证调用顺序：扣库存必须在扣余额之前
            InOrder inOrder = inOrder(productDao, userDao, orderDao);
            inOrder.verify(productDao).deductStock(100L, 1);
            inOrder.verify(userDao).save(any(User.class));
            inOrder.verify(orderDao).save(any(Order.class));
        }

        @Test
        @DisplayName("余额不足：库存自动回滚，订单不创建")
        void balanceNotEnoughRollbackStock() {
            buyer.setBalance(100L); // 余额不足

            when(productDao.deductStock(100L, 1)).thenReturn(true);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> orderService.create(1L, 100L, 1, "addr"));
            assertEquals("余额不足", ex.getMessage());

            verify(productDao, times(1)).rollbackStock(100L, 1);
            verify(orderDao, never()).save(any());
        }

        @Test
        @DisplayName("库存不足：直接抛异常，不扣余额")
        void stockNotEnough() {
            when(productDao.deductStock(100L, 100)).thenReturn(false);
            assertThrows(BusinessException.class,
                    () -> orderService.create(1L, 100L, 100, "addr"));
            verify(userDao, never()).save(any());
            verify(orderDao, never()).save(any());
        }

        @ParameterizedTest
        @CsvSource({
                ",100,1,addr,  买家ID空",
                "1,,1,addr,    商品ID空",
                "1,100,0,addr, 数量0",
                "1,100,-1,addr,数量负",
                "1,100,1,,     地址空"
        })
        @DisplayName("创建订单参数非法")
        void createInvalidParam(Long bid, Long pid, Integer qty, String addr, String desc) {
            assertThrows(BusinessException.class,
                    () -> orderService.create(bid, pid, qty, addr), desc);
        }
    }

    // ====== 发货 ======
    @Nested
    @DisplayName("卖家发货")
    class Ship {

        private Order paidOrder() {
            Order o = new Order();
            o.setId(3001L);
            o.setBuyerId(1L);
            o.setProductId(100L);
            o.setQuantity(1);
            o.setTotalAmount(699_900);
            o.setStatus("PAID");
            return o;
        }

        @Test
        void shipSuccess() {
            Order o = paidOrder();
            when(orderDao.findById(3001L)).thenReturn(Optional.of(o));
            when(orderDao.save(any(Order.class))).thenReturn(o);

            Order r = orderService.ship(3001L, 2L);
            assertEquals("SHIPPED", r.getStatus());
            assertNotNull(r.getShippedAt());
        }

        @Test
        void shipNonSellerFails() {
            Order o = paidOrder();
            when(orderDao.findById(3001L)).thenReturn(Optional.of(o));
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> orderService.ship(3001L, 1L)); // 1 是买家，不是卖家
            assertEquals(403, ex.getCode());
        }

        @Test
        void shipWrongStatusCannotShipTwice() {
            Order o = paidOrder();
            o.setStatus("SHIPPED");
            when(orderDao.findById(3001L)).thenReturn(Optional.of(o));
            assertThrows(BusinessException.class, () -> orderService.ship(3001L, 2L));
        }
    }

    // ====== 确认收货 ======
    @Nested
    @DisplayName("买家确认收货")
    class Complete {
        @Test
        void completeSuccess() {
            Order o = new Order();
            o.setId(3001L);
            o.setBuyerId(1L);
            o.setStatus("SHIPPED");
            when(orderDao.findById(3001L)).thenReturn(Optional.of(o));
            when(orderDao.save(any())).thenReturn(o);

            Order r = orderService.complete(3001L, 1L);
            assertEquals("COMPLETED", r.getStatus());
        }

        @Test
        void completeNotBuyer() {
            Order o = new Order();
            o.setId(3001L); o.setBuyerId(1L); o.setStatus("SHIPPED");
            when(orderDao.findById(3001L)).thenReturn(Optional.of(o));
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> orderService.complete(3001L, 2L));
            assertEquals(403, ex.getCode());
        }
    }

    // ====== 取消订单 ======
    @Nested
    @DisplayName("取消订单")
    class Cancel {
        @Test
        @DisplayName("已付款取消：库存回滚 + 余额退款")
        void cancelPaidRefund() {
            Order o = new Order();
            o.setId(3001L);
            o.setBuyerId(1L);
            o.setProductId(100L);
            o.setQuantity(1);
            o.setTotalAmount(699_900);
            o.setStatus("PAID");
            when(orderDao.findById(3001L)).thenReturn(Optional.of(o));
            when(orderDao.save(any())).thenReturn(o);
            when(userDao.save(any(User.class))).thenReturn(buyer);

            Order r = orderService.cancel(3001L, 1L);
            assertEquals("CANCELLED", r.getStatus());
            verify(productDao, times(1)).rollbackStock(100L, 1);
            verify(userDao, times(1)).save(any(User.class));
        }

        @Test
        @DisplayName("已完成订单不能取消")
        void cancelCompletedFails() {
            Order o = new Order();
            o.setId(3001L); o.setBuyerId(1L); o.setStatus("COMPLETED");
            when(orderDao.findById(3001L)).thenReturn(Optional.of(o));
            assertThrows(BusinessException.class, () -> orderService.cancel(3001L, 1L));
        }

        @Test
        @DisplayName("管理员可取消任意买家的订单")
        void adminCancelAny() {
            Order o = new Order();
            o.setId(3001L);
            o.setBuyerId(1L); o.setProductId(100L); o.setQuantity(1);
            o.setTotalAmount(1); o.setStatus("PAID");
            when(orderDao.findById(3001L)).thenReturn(Optional.of(o));
            when(orderDao.save(any())).thenReturn(o);
            when(userDao.save(any())).thenReturn(buyer);

            Order r = orderService.cancel(3001L, 9L); // admin id=9
            assertEquals("CANCELLED", r.getStatus());
        }
    }

    // ====== 订单售后退款 ======
    @Nested
    @DisplayName("订单售后退款")
    class Refund {

        private User anotherBuyer;

        @BeforeEach
        void setUp() {
            anotherBuyer = new User(3L, "buyer02", "Buyer123", "b2@x.com", "BUYER");
            anotherBuyer.setStatus(1);
            when(userDao.findById(3L)).thenReturn(Optional.of(anotherBuyer));
            when(userDao.save(any(User.class))).thenReturn(buyer);
        }

        @Test
        @DisplayName("PAID 买家本人退款成功：状态→REFUNDED，refundedAt非空，回库存+退余额+保存订单各1次")
        void refundPaidByBuyerSuccess() {
            Order o = new Order();
            o.setId(3001L);
            o.setBuyerId(1L);
            o.setProductId(100L);
            o.setQuantity(1);
            o.setTotalAmount(699_900);
            o.setStatus("PAID");
            o.setOrderNo("NO20250101000001");
            when(orderDao.findById(3001L)).thenReturn(Optional.of(o));
            when(orderDao.save(any(Order.class))).thenReturn(o);

            Order r = orderService.refund(3001L, 1L);

            assertEquals("REFUNDED", r.getStatus());
            assertNotNull(r.getRefundedAt());
            verify(productDao, times(1)).rollbackStock(100L, 1);
            verify(userDao, times(1)).save(any(User.class));
            verify(orderDao, times(1)).save(any(Order.class));
        }

        @Test
        @DisplayName("SHIPPED 买家退款成功")
        void refundShippedByBuyerSuccess() {
            Order o = new Order();
            o.setId(3002L);
            o.setBuyerId(1L);
            o.setProductId(100L);
            o.setQuantity(1);
            o.setTotalAmount(699_900);
            o.setStatus("SHIPPED");
            o.setOrderNo("NO20250101000002");
            when(orderDao.findById(3002L)).thenReturn(Optional.of(o));
            when(orderDao.save(any(Order.class))).thenReturn(o);

            Order r = orderService.refund(3002L, 1L);

            assertEquals("REFUNDED", r.getStatus());
            assertNotNull(r.getRefundedAt());
            verify(productDao, times(1)).rollbackStock(100L, 1);
            verify(userDao, times(1)).save(any(User.class));
            verify(orderDao, times(1)).save(any(Order.class));
        }

        @Test
        @DisplayName("COMPLETED 管理员退款成功")
        void refundCompletedByAdminSuccess() {
            Order o = new Order();
            o.setId(3003L);
            o.setBuyerId(1L);
            o.setProductId(100L);
            o.setQuantity(1);
            o.setTotalAmount(699_900);
            o.setStatus("COMPLETED");
            o.setOrderNo("NO20250101000003");
            when(orderDao.findById(3003L)).thenReturn(Optional.of(o));
            when(orderDao.save(any(Order.class))).thenReturn(o);

            Order r = orderService.refund(3003L, 9L);

            assertEquals("REFUNDED", r.getStatus());
            assertNotNull(r.getRefundedAt());
            verify(productDao, times(1)).rollbackStock(100L, 1);
            verify(userDao, times(1)).save(any(User.class));
            verify(orderDao, times(1)).save(any(Order.class));
        }

        @Test
        @DisplayName("CANCELLED 状态不可退款，抛异常")
        void refundCancelledFails() {
            Order o = new Order();
            o.setId(3004L);
            o.setBuyerId(1L);
            o.setStatus("CANCELLED");
            when(orderDao.findById(3004L)).thenReturn(Optional.of(o));

            assertThrows(BusinessException.class, () -> orderService.refund(3004L, 1L));
        }

        @Test
        @DisplayName("非买家非管理员（另一个BUYER）退款，403 抛异常")
        void refundByOtherBuyerFails403() {
            Order o = new Order();
            o.setId(3005L);
            o.setBuyerId(1L);
            o.setStatus("PAID");
            when(orderDao.findById(3005L)).thenReturn(Optional.of(o));

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> orderService.refund(3005L, 3L));
            assertEquals(403, ex.getCode());
        }
    }
}
