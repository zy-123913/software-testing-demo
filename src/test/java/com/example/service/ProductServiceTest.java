package com.example.service;

import com.example.dao.ProductDao;
import com.example.entity.Product;
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

import java.util.*;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("商品服务单元测试")
class ProductServiceTest {

    @Mock private ProductDao productDao;
    @InjectMocks private ProductService productService;

    private Product phone;
    private Product laptop;
    private Product book;
    private Product offShelfProduct;

    @BeforeEach
    void initSample() {
        phone = new Product(100L, "iPhone 15", 699_900, 50, "电子产品", 2L);
        phone.setStatus(1);

        laptop = new Product(101L, "MacBook Pro", 1_499_900, 30, "电子产品", 2L);
        laptop.setStatus(1);

        book = new Product(200L, "Java 编程思想", 99_00, 100, "图书", 3L);
        book.setStatus(1);

        offShelfProduct = new Product(300L, "旧款手机", 99_00, 5, "电子产品", 2L);
        offShelfProduct.setStatus(0);
    }

    @Nested
    @DisplayName("创建商品模块")
    class CreateProduct {

        @Test
        @DisplayName("创建成功 - 同卖家不同名")
        void createSuccessDifferentName() {
            when(productDao.findBySellerIdAndNameIgnoreCase(2L, "iPhone 16")).thenReturn(Optional.empty());
            when(productDao.save(any(Product.class))).thenAnswer(inv -> {
                Product p = inv.getArgument(0);
                p.setId(102L);
                return p;
            });

            Product result = productService.create("iPhone 16", 799_900, 20, "电子产品", 2L);

            assertNotNull(result.getId());
            assertEquals("iPhone 16", result.getName());
            assertEquals(799_900, result.getPrice());
            assertEquals(20, result.getStock());
            assertEquals("电子产品", result.getCategory());
            assertEquals(Long.valueOf(2L), result.getSellerId());
            verify(productDao, times(1)).save(any(Product.class));
        }

        @ParameterizedTest(name = "同名商品查重：'{0}'")
        @ValueSource(strings = {"iPhone 15", "iphone 15", " IPHONE 15 ", "  iphone 15"})
        @DisplayName("同卖家同名忽略大小写查重 - 抛异常")
        void createDuplicateNameIgnoreCase(String duplicateName) {
            when(productDao.findBySellerIdAndNameIgnoreCase(eq(2L), anyString())).thenReturn(Optional.of(phone));

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> productService.create(duplicateName, 100, 10, "电子产品", 2L));
            assertTrue(ex.getMessage().contains("同名"));
            verify(productDao, never()).save(any());
        }

        @ParameterizedTest(name = "非法价格：{0}")
        @ValueSource(ints = {0, -1, -100})
        @DisplayName("price <= 0 抛异常")
        void createInvalidPrice(Integer price) {
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> productService.create("测试商品", price, 10, "电子产品", 2L));
            assertTrue(ex.getMessage().contains("价格"));
            verify(productDao, never()).save(any());
        }

        @Test
        @DisplayName("price = null 抛异常")
        void createNullPrice() {
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> productService.create("测试商品", null, 10, "电子产品", 2L));
            assertTrue(ex.getMessage().contains("价格"));
            verify(productDao, never()).save(any());
        }

        @Test
        @DisplayName("stock < 0 抛异常")
        void createNegativeStock() {
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> productService.create("测试商品", 100, -5, "电子产品", 2L));
            assertTrue(ex.getMessage().contains("库存"));
            verify(productDao, never()).save(any());
        }

        @Test
        @DisplayName("stock = null 抛异常")
        void createNullStock() {
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> productService.create("测试商品", 100, null, "电子产品", 2L));
            assertTrue(ex.getMessage().contains("库存"));
            verify(productDao, never()).save(any());
        }

        @ParameterizedTest(name = "分类非法：{0}")
        @NullAndEmptySource
        @DisplayName("category 空抛异常")
        void createEmptyCategory(String category) {
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> productService.create("测试商品", 100, 10, category, 2L));
            assertTrue(ex.getMessage().contains("分类"));
            verify(productDao, never()).save(any());
        }

        @ParameterizedTest(name = "商品名非法：'{0}'")
        @NullAndEmptySource
        @ValueSource(strings = {"   ", "\t", "\n"})
        @DisplayName("name 空抛异常")
        void createEmptyName(String name) {
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> productService.create(name, 100, 10, "电子产品", 2L));
            assertTrue(ex.getMessage().contains("商品名"));
            verify(productDao, never()).save(any());
        }

        @Test
        @DisplayName("sellerId 空抛异常")
        void createNullSellerId() {
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> productService.create("测试商品", 100, 10, "电子产品", null));
            assertTrue(ex.getMessage().contains("卖家"));
            verify(productDao, never()).save(any());
        }
    }

    @Nested
    @DisplayName("按ID查询商品")
    class GetById {

        @Test
        @DisplayName("找到商品")
        void getByIdFound() {
            when(productDao.findById(100L)).thenReturn(Optional.of(phone));
            Product result = productService.getById(100L);
            assertEquals("iPhone 15", result.getName());
            assertEquals(Long.valueOf(100L), result.getId());
        }

        @Test
        @DisplayName("404 抛异常")
        void getByIdNotFound() {
            when(productDao.findById(999L)).thenReturn(Optional.empty());
            BusinessException ex = assertThrows(BusinessException.class, () -> productService.getById(999L));
            assertEquals(404, ex.getCode());
            assertTrue(ex.getMessage().contains("不存在"));
        }

        @Test
        @DisplayName("id 空抛异常")
        void getByIdNull() {
            BusinessException ex = assertThrows(BusinessException.class, () -> productService.getById(null));
            assertTrue(ex.getMessage().contains("ID"));
        }
    }

    @Nested
    @DisplayName("列表查询模块")
    class ListQuery {

        @Test
        @DisplayName("listAll - 返回全部商品")
        void listAllReturnsDaoList() {
            when(productDao.findAll()).thenReturn(Arrays.asList(phone, laptop, book));
            List<Product> list = productService.listAll();
            assertEquals(3, list.size());
            verify(productDao, times(1)).findAll();
        }

        @Test
        @DisplayName("listByCategory - 按分类筛选")
        void listByCategoryFiltersCorrectly() {
            when(productDao.findByCategory("电子产品")).thenReturn(Arrays.asList(phone, laptop));
            List<Product> electronics = productService.listByCategory("电子产品");
            assertEquals(2, electronics.size());
            assertTrue(electronics.stream().allMatch(p -> "电子产品".equals(p.getCategory())));
            verify(productDao, times(1)).findByCategory("电子产品");
        }

        @Test
        @DisplayName("listByCategory - category为null抛异常")
        void listByCategoryNull() {
            assertThrows(BusinessException.class, () -> productService.listByCategory(null));
        }
    }

    @Nested
    @DisplayName("商品搜索模块")
    class SearchProduct {

        private List<Product> allProducts;

        @BeforeEach
        void setUpSearchData() {
            allProducts = new ArrayList<>();
            for (int i = 1; i <= 25; i++) {
                Product p;
                if (i <= 10) {
                    p = new Product((long) i, "Phone " + i, 10000 + i * 100, 50 + i, "电子产品", 2L);
                } else if (i <= 20) {
                    p = new Product((long) i, "Laptop " + (i - 10), 50000 + i * 100, 20 + i, "电子产品", 2L);
                } else {
                    p = new Product((long) i, "Book " + (i - 20), 5000 + i * 10, 100 + i, "图书", 3L);
                }
                p.setStatus(1);
                allProducts.add(p);
            }
        }

        @Test
        @DisplayName("关键字模糊匹配 - 大小写不敏感、前后空格（由DAO层处理）")
        void searchKeywordFuzzyMatch() {
            List<Product> phoneMatches = allProducts.stream()
                    .filter(p -> p.getName().toLowerCase().contains("phone"))
                    .collect(Collectors.toList());
            when(productDao.search(anyString(), isNull(), isNull())).thenReturn(phoneMatches);

            Map<String, Object> result1 = productService.search("  Phone  ", null, null, 1, 10);
            assertEquals(10, ((List<?>) result1.get("list")).size());

            Map<String, Object> result2 = productService.search("PHONE", null, null, 1, 10);
            assertEquals(10, ((List<?>) result2.get("list")).size());

            Map<String, Object> result3 = productService.search("phone", null, null, 1, 10);
            assertEquals(10, ((List<?>) result3.get("list")).size());

            verify(productDao, times(3)).search(anyString(), isNull(), isNull());
        }

        @Test
        @DisplayName("分类筛选")
        void searchFilterByCategory() {
            List<Product> books = allProducts.stream()
                    .filter(p -> "图书".equals(p.getCategory()))
                    .collect(Collectors.toList());
            when(productDao.search(null, "图书", null)).thenReturn(books);

            Map<String, Object> result = productService.search(null, "图书", null, 1, 10);
            assertEquals(5, result.get("total"));
            assertEquals(5, ((List<?>) result.get("list")).size());
        }

        @Test
        @DisplayName("卖家筛选")
        void searchFilterBySeller() {
            List<Product> seller3Products = allProducts.stream()
                    .filter(p -> Long.valueOf(3L).equals(p.getSellerId()))
                    .collect(Collectors.toList());
            when(productDao.search(null, null, 3L)).thenReturn(seller3Products);

            Map<String, Object> result = productService.search(null, null, 3L, 1, 10);
            assertEquals(5, result.get("total"));
            assertEquals(5, ((List<?>) result.get("list")).size());
        }

        @Test
        @DisplayName("分页越界返回空list")
        void searchPageOutOfBoundsEmpty() {
            when(productDao.search(null, null, null)).thenReturn(allProducts);

            Map<String, Object> result = productService.search(null, null, null, 100, 10);
            assertTrue(((List<?>) result.get("list")).isEmpty());
            assertEquals(25, result.get("total"));
            assertEquals(100, result.get("page"));
            assertEquals(10, result.get("size"));
        }

        @ParameterizedTest(name = "page={0} 修正为 1")
        @ValueSource(ints = {0, -1, -100, Integer.MIN_VALUE})
        @DisplayName("分页参数修正 - page < 1 → 1")
        void searchPageLessThanOneCorrected(int invalidPage) {
            when(productDao.search(null, null, null)).thenReturn(allProducts);

            Map<String, Object> result = productService.search(null, null, null, invalidPage, 10);
            assertEquals(1, result.get("page"));
            assertEquals(10, ((List<?>) result.get("list")).size());
        }

        @ParameterizedTest(name = "size={0} 修正为 100")
        @ValueSource(ints = {101, 200, 500, 10000})
        @DisplayName("分页参数修正 - size > 100 → 100")
        void searchSizeGreaterThan100Corrected(int invalidSize) {
            when(productDao.search(null, null, null)).thenReturn(allProducts);

            Map<String, Object> result = productService.search(null, null, null, 1, invalidSize);
            assertEquals(100, result.get("size"));
            assertEquals(25, ((List<?>) result.get("list")).size());
        }

        @ParameterizedTest(name = "size={0} 修正为 10")
        @ValueSource(ints = {0, -1, -50})
        @DisplayName("分页参数修正 - size < 1 → 10")
        void searchSizeLessThanOneCorrected(int invalidSize) {
            when(productDao.search(null, null, null)).thenReturn(allProducts);

            Map<String, Object> result = productService.search(null, null, null, 1, invalidSize);
            assertEquals(10, result.get("size"));
            assertEquals(10, ((List<?>) result.get("list")).size());
        }

        @ParameterizedTest(name = "total={0}, size={1} → totalPages={2}")
        @CsvSource({
                "0, 10, 0",
                "1, 10, 1",
                "10, 10, 1",
                "11, 10, 2",
                "25, 10, 3",
                "100, 100, 1",
                "101, 100, 2"
        })
        @DisplayName("totalPages 计算正确")
        void searchTotalPagesCalculated(int total, int size, int expectedTotalPages) {
            List<Product> testData = new ArrayList<>();
            for (long i = 1; i <= total; i++) {
                Product p = new Product(i, "P" + i, 100, 10, "C", 1L);
                testData.add(p);
            }
            when(productDao.search(null, null, null)).thenReturn(testData);

            Map<String, Object> result = productService.search(null, null, null, 1, size);
            assertEquals(expectedTotalPages, result.get("totalPages"));
        }

        @Test
        @DisplayName("search 结果含 list/total/page/size/totalPages")
        void searchResultContainsAllKeys() {
            when(productDao.search(null, null, null)).thenReturn(allProducts);

            Map<String, Object> result = productService.search(null, null, null, 2, 10);

            assertTrue(result.containsKey("list"));
            assertTrue(result.containsKey("total"));
            assertTrue(result.containsKey("page"));
            assertTrue(result.containsKey("size"));
            assertTrue(result.containsKey("totalPages"));

            assertEquals(25, result.get("total"));
            assertEquals(2, result.get("page"));
            assertEquals(10, result.get("size"));
            assertEquals(3, result.get("totalPages"));
            assertEquals(10, ((List<?>) result.get("list")).size());
        }

        @Test
        @DisplayName("分页中间页正确截取")
        void searchMiddlePageCorrect() {
            when(productDao.search(null, null, null)).thenReturn(allProducts);

            Map<String, Object> result = productService.search(null, null, null, 3, 10);
            List<?> list = (List<?>) result.get("list");
            assertEquals(5, list.size());
        }
    }

    @Nested
    @DisplayName("状态与价格管理")
    class StatusAndPrice {

        @BeforeEach
        void setUp() {
            when(productDao.findById(100L)).thenReturn(Optional.of(phone));
            when(productDao.save(any(Product.class))).thenReturn(phone);
        }

        @ParameterizedTest(name = "设置状态为 {0}")
        @ValueSource(ints = {0, 1})
        @DisplayName("setStatus 基本路径 - 成功")
        void setStatusSuccess(Integer status) {
            Product result = productService.setStatus(100L, status, 9L);
            assertEquals(status, result.getStatus());
            verify(productDao, times(1)).save(phone);
        }

        @ParameterizedTest(name = "非法状态：{0}")
        @ValueSource(ints = {2, -1, 999})
        @DisplayName("setStatus - 状态不合法抛异常")
        void setStatusInvalid(Integer status) {
            assertThrows(BusinessException.class,
                    () -> productService.setStatus(100L, status, 9L));
            verify(productDao, never()).save(any());
        }

        @Test
        @DisplayName("setStatus - operatorId为null抛403")
        void setStatusNullOperator() {
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> productService.setStatus(100L, 1, null));
            assertEquals(403, ex.getCode());
        }

        @Test
        @DisplayName("updatePrice - 基本路径成功")
        void updatePriceSuccess() {
            Product result = productService.updatePrice(100L, 899_900);
            assertEquals(899_900, result.getPrice());
            verify(productDao, times(1)).save(phone);
        }

        @ParameterizedTest(name = "非法价格：{0}")
        @ValueSource(ints = {0, -1, -100})
        @DisplayName("updatePrice - 价格不合法抛异常")
        void updatePriceInvalid(Integer newPrice) {
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> productService.updatePrice(100L, newPrice));
            assertTrue(ex.getMessage().contains("价格"));
            verify(productDao, never()).save(any());
        }

        @Test
        @DisplayName("updatePrice - null价格抛异常")
        void updatePriceNull() {
            assertThrows(BusinessException.class,
                    () -> productService.updatePrice(100L, null));
        }
    }

    @Nested
    @DisplayName("库存管理模块")
    class StockManagement {

        @BeforeEach
        void setUp() {
            when(productDao.findById(100L)).thenReturn(Optional.of(phone));
            when(productDao.findById(300L)).thenReturn(Optional.of(offShelfProduct));
        }

        @Test
        @DisplayName("deductStock - 扣减成功")
        void deductStockSuccess() {
            when(productDao.deductStock(100L, 5)).thenReturn(true);
            assertDoesNotThrow(() -> productService.deductStock(100L, 5));
            verify(productDao, times(1)).deductStock(100L, 5);
        }

        @Test
        @DisplayName("deductStock - 库存不足抛异常")
        void deductStockInsufficient() {
            when(productDao.deductStock(100L, 999)).thenReturn(false);
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> productService.deductStock(100L, 999));
            assertTrue(ex.getMessage().contains("库存不足"));
        }

        @ParameterizedTest(name = "非法数量：{0}")
        @ValueSource(ints = {0, -1, -100})
        @DisplayName("deductStock - 数量<=0抛异常")
        void deductStockInvalidQuantity(int qty) {
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> productService.deductStock(100L, qty));
            assertTrue(ex.getMessage().contains("数量"));
            verify(productDao, never()).deductStock(anyLong(), anyInt());
        }

        @Test
        @DisplayName("deductStock - 已下架商品抛异常")
        void deductStockOffShelf() {
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> productService.deductStock(300L, 1));
            assertTrue(ex.getMessage().contains("下架"));
            verify(productDao, never()).deductStock(anyLong(), anyInt());
        }

        @Test
        @DisplayName("rollbackStock - 基本路径成功")
        void rollbackStockSuccess() {
            doNothing().when(productDao).rollbackStock(100L, 10);
            assertDoesNotThrow(() -> productService.rollbackStock(100L, 10));
            verify(productDao, times(1)).rollbackStock(100L, 10);
        }

        @ParameterizedTest(name = "数量<=0直接返回：{0}")
        @ValueSource(ints = {0, -1, -50})
        @DisplayName("rollbackStock - 数量<=0不调用DAO")
        void rollbackStockNonPositiveReturnsEarly(int qty) {
            productService.rollbackStock(100L, qty);
            verify(productDao, never()).rollbackStock(anyLong(), anyInt());
        }
    }
}
