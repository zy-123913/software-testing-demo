package com.example.service;

import com.example.dao.TransactionLogDao;
import com.example.dao.UserDao;
import com.example.entity.TransactionLog;
import com.example.entity.User;
import com.example.common.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * UserService 单元测试
 *  - 使用 Mockito 对 UserDao 依赖进行打桩
 *  - 使用 @Nested 将测试按模块分组
 *  - 使用 @ParameterizedTest 覆盖非法参数场景
 *  - 使用 verify() 验证 dao 调用次数（避免过度调用）
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("用户服务单元测试")
class UserServiceTest {

    @Mock private UserDao userDao;
    @Mock private TransactionLogDao txLogDao;
    @InjectMocks private UserService userService;

    private User sampleBuyer;

    @BeforeEach
    void initSample() {
        sampleBuyer = new User(1L, "zhangsan", "Zhang123", "zhang@example.com", "BUYER");
        sampleBuyer.setBalance(500000L);
        sampleBuyer.setStatus(1);
    }

    // ====== 注册模块 ======
    @Nested
    @DisplayName("注册模块")
    class Register {

        @Test
        @DisplayName("注册 BUYER 成功 - 返回含 ID 的用户并写入 DAO")
        void registerSuccess() {
            when(userDao.findByUsername("zhangsan")).thenReturn(Optional.empty());
            when(userDao.save(any(User.class))).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                u.setId(11L);
                return u;
            });

            User result = userService.register("zhangsan", "Zhang1234", "zhang@example.com", "BUYER");

            assertNotNull(result.getId());
            assertEquals("zhangsan", result.getUsername());
            assertEquals("BUYER", result.getRole());
            assertEquals(1, result.getStatus());
            verify(userDao, times(1)).save(any(User.class));
        }

        @Test
        @DisplayName("注册 SELLER 成功")
        void registerSellerSuccess() {
            when(userDao.findByUsername(anyString())).thenReturn(Optional.empty());
            when(userDao.save(any(User.class))).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                u.setId(12L);
                return u;
            });
            User result = userService.register("seller", "Seller12", "s@x.com", "SELLER");
            assertEquals("SELLER", result.getRole());
        }

        @ParameterizedTest(name = "用户名非法：{0}")
        @ValueSource(strings = {"ab", "", "abcdefghijklmnopqrstuvwxyzABCDEFG"}) // <3 或 >32 (最后1个长度为33)
        void registerInvalidUsername(String username) {
            assertThrows(BusinessException.class,
                    () -> userService.register(username, "Zhang1234", "z@x.com", "BUYER"),
                    "用户名长度校验失败");
            verify(userDao, never()).save(any());
        }

        @ParameterizedTest(name = "密码非法：{0}")
        @CsvSource({
                "12345,   太短",
                "abcdef,  无大写+数字",
                "AAAAAA,  无数字",
                "123456,  无大写"
        })
        void registerInvalidPassword(String pwd, String desc) {
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> userService.register("validuser", pwd, "z@x.com", "BUYER"));
            assertTrue(ex.getMessage().contains("密码"), desc);
        }

        @ParameterizedTest(name = "邮箱非法：{0}")
        @ValueSource(strings = {"notemail", "@x.com", "a@.com", "a@b"})
        void registerInvalidEmail(String email) {
            assertThrows(BusinessException.class,
                    () -> userService.register("validuser", "Zhang1234", email, "BUYER"));
        }

        @ParameterizedTest(name = "角色非法：{0}")
        @NullAndEmptySource
        @ValueSource(strings = {"SUPER", "USER", "root"})
        void registerInvalidRole(String role) {
            assertThrows(BusinessException.class,
                    () -> userService.register("u12345", "Zhang1234", "z@x.com", role));
        }

        @Test
        @DisplayName("注册 - 用户名已存在时抛出异常")
        void registerDuplicateUsername() {
            when(userDao.findByUsernameIgnoreCase("zhangsan")).thenReturn(Optional.of(sampleBuyer));
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> userService.register("zhangsan", "Zhang1234", "z@x.com", "BUYER"));
            assertTrue(ex.getMessage().contains("已存在"));
            verify(userDao, never()).save(any());
        }
    }

    // ====== 登录模块 ======
    @Nested
    @DisplayName("登录模块")
    class Login {
        @Test
        void loginSuccess() {
            when(userDao.findByUsername("zhangsan")).thenReturn(Optional.of(sampleBuyer));
            User result = userService.login("zhangsan", "Zhang123");
            assertEquals(Long.valueOf(1), result.getId());
        }

        @Test
        void loginWrongPassword() {
            when(userDao.findByUsername("zhangsan")).thenReturn(Optional.of(sampleBuyer));
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> userService.login("zhangsan", "WrongPwd1"));
            assertEquals(401, ex.getCode());
        }

        @Test
        void loginUserDisabled() {
            sampleBuyer.setStatus(0);
            when(userDao.findByUsername("zhangsan")).thenReturn(Optional.of(sampleBuyer));
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> userService.login("zhangsan", "Zhang123"));
            assertEquals(403, ex.getCode());
        }

        @Test
        void loginUsernameNotFound() {
            when(userDao.findByUsername(anyString())).thenReturn(Optional.empty());
            assertThrows(BusinessException.class,
                    () -> userService.login("nobody", "AnyPwd1"));
        }

        @ParameterizedTest
        @CsvSource({",AnyPwd1", "zhangsan,"})
        void loginNullParam(String u, String p) {
            assertThrows(BusinessException.class, () -> userService.login(u, p));
        }
    }

    // ====== 查询模块 ======
    @Nested
    @DisplayName("查询模块")
    class Query {
        @Test
        void getByIdFound() {
            when(userDao.findById(1L)).thenReturn(Optional.of(sampleBuyer));
            User u = userService.getById(1L);
            assertEquals("zhangsan", u.getUsername());
        }

        @Test
        void getByIdNotFound() {
            when(userDao.findById(999L)).thenReturn(Optional.empty());
            BusinessException ex = assertThrows(BusinessException.class, () -> userService.getById(999L));
            assertEquals(404, ex.getCode());
        }

        @Test
        void listAllReturnsDaoList() {
            when(userDao.findAll()).thenReturn(Arrays.asList(sampleBuyer));
            List<User> list = userService.listAll();
            assertEquals(1, list.size());
        }

        @Test
        void listByRoleFiltersCorrectly() {
            User admin = new User(2L, "admin", "Admin123", "a@x.com", "ADMIN");
            when(userDao.findByRole("ADMIN")).thenReturn(Arrays.asList(admin));
            List<User> admins = userService.listByRole("ADMIN");
            assertTrue(admins.stream().allMatch(u -> "ADMIN".equals(u.getRole())));
        }
    }

    // ====== 余额模块 ======
    @Nested
    @DisplayName("余额模块")
    class Balance {
        @BeforeEach
        void setUp() {
            when(userDao.findById(1L)).thenReturn(Optional.of(sampleBuyer));
            when(userDao.save(any(User.class))).thenReturn(sampleBuyer);
        }

        @Test
        void deductSuccess() {
            assertTrue(userService.deductBalance(1L, 100000));
            assertEquals(Long.valueOf(400000), sampleBuyer.getBalance());
            verify(userDao, times(1)).save(sampleBuyer);
        }

        @Test
        void deductInsufficient() {
            assertThrows(BusinessException.class, () -> userService.deductBalance(1L, 99999999));
        }

        @ParameterizedTest
        @ValueSource(ints = {0, -1, -100})
        void deductInvalidAmount(int amt) {
            assertThrows(BusinessException.class, () -> userService.deductBalance(1L, amt));
            verify(userDao, never()).save(any());
        }

        @Test
        void rechargePositive() {
            Long newBal = userService.recharge(1L, 50000);
            assertEquals(Long.valueOf(550000), newBal);
        }
    }

    // ====== 状态修改（管理员权限） ======
    @Nested
    @DisplayName("管理员状态修改")
    class AdminStatus {
        @Test
        void adminSetStatusOk() {
            User admin = new User(9L, "admin", "Admin123", "a@x.com", "ADMIN");
            when(userDao.findById(9L)).thenReturn(Optional.of(admin));
            when(userDao.findById(1L)).thenReturn(Optional.of(sampleBuyer));
            when(userDao.save(any())).thenReturn(sampleBuyer);

            assertTrue(userService.setStatus(1L, 0, 9L));
            assertEquals(0, sampleBuyer.getStatus());
        }

        @Test
        void buyerCannotSetStatus() {
            when(userDao.findById(1L)).thenReturn(Optional.of(sampleBuyer));
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> userService.setStatus(2L, 0, 1L));
            assertEquals(403, ex.getCode());
        }
    }

    // ====== 账户流水模块 ======
    @Nested
    @DisplayName("账户流水模块")
    class TxLog {

        @BeforeEach
        void setUp() {
            userService = new UserService(userDao, txLogDao);
            when(userDao.findById(1L)).thenReturn(Optional.of(sampleBuyer));
            when(userDao.save(any(User.class))).thenReturn(sampleBuyer);
        }

        @Test
        @DisplayName("listTransactions: 用户存在时返回 txLogDao.findByUserId 结果")
        void listTransactionsUserFound() {
            List<TransactionLog> mockLogs = Arrays.asList(
                    new TransactionLog(1L, "RECHARGE", 50000, 550000L, null, "充值"),
                    new TransactionLog(1L, "PAY", -100000, 450000L, "NO001", "消费")
            );
            when(txLogDao.findByUserId(1L)).thenReturn(mockLogs);

            List<TransactionLog> result = userService.listTransactions(1L);

            assertEquals(2, result.size());
            verify(txLogDao, times(1)).findByUserId(1L);
        }

        @Test
        @DisplayName("listTransactions: userId 为 null 抛异常")
        void listTransactionsUserIdNull() {
            assertThrows(BusinessException.class,
                    () -> userService.listTransactions(null));
        }

        @Test
        @DisplayName("listTransactions: 用户不存在抛 404")
        void listTransactionsUserNotFound() {
            when(userDao.findById(999L)).thenReturn(Optional.empty());
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> userService.listTransactions(999L));
            assertEquals(404, ex.getCode());
        }

        @Test
        @DisplayName("listTransactions: txLogDao 为 null (旧构造) 返回空 list")
        void listTransactionsTxLogDaoNull() {
            UserService oldService = new UserService(userDao, null);
            List<TransactionLog> result = oldService.listTransactions(1L);
            assertNotNull(result);
            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("recharge 成功时调用 txLogDao.save 一次，类型=RECHARGE，金额为正，balanceAfter>=amount")
        void rechargeWriteTxLog() {
            int amount = 50000;
            when(txLogDao.save(any(TransactionLog.class))).thenAnswer(inv -> inv.getArgument(0));

            userService.recharge(1L, amount);

            verify(txLogDao, times(1)).save(any(TransactionLog.class));
            verify(txLogDao).save(argThat(log ->
                    "RECHARGE".equals(log.getType())
                            && log.getAmount() > 0
                            && log.getBalanceAfter() >= log.getAmount()
            ));
        }

        @Test
        @DisplayName("deductBalance 成功时写 PAY 流水，amount 为负")
        void deductBalanceWriteTxLog() {
            int amount = 100000;
            when(txLogDao.save(any(TransactionLog.class))).thenAnswer(inv -> inv.getArgument(0));

            userService.deductBalance(1L, amount);

            verify(txLogDao, times(1)).save(any(TransactionLog.class));
            verify(txLogDao).save(argThat(log ->
                    "PAY".equals(log.getType()) && log.getAmount() < 0
            ));
        }

        @Test
        @DisplayName("recharge 金额<=0 不写流水")
        void rechargeInvalidAmountNoTxLog() {
            UserService service = new UserService(userDao, txLogDao);
            when(userDao.findById(1L)).thenReturn(Optional.of(sampleBuyer));

            assertThrows(BusinessException.class, () -> service.recharge(1L, 0));
            assertThrows(BusinessException.class, () -> service.recharge(1L, -100));
            verify(txLogDao, never()).save(any());
        }
    }
}
