package com.example.service;

import com.example.dao.ProductDao;
import com.example.entity.Product;
import com.example.common.BusinessException;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 商品服务：商品 CRUD + 库存管理 + 搜索分页
 */
public class ProductService {

    private final ProductDao productDao;

    public ProductService(ProductDao productDao) {
        this.productDao = productDao;
    }

    /** 新增商品（同卖家名下商品名忽略大小写查重） */
    public Product create(String name, Integer price, Integer stock, String category, Long sellerId) {
        if (name == null || name.trim().isEmpty()) throw new BusinessException("商品名不能为空");
        String cleanName = name.trim();
        if (cleanName.length() > 100) throw new BusinessException("商品名不能超过 100 字符");
        if (price == null || price <= 0) throw new BusinessException("价格必须为正数（单位：分）");
        if (stock == null || stock < 0) throw new BusinessException("库存不能为负数");
        if (category == null || category.isEmpty()) throw new BusinessException("分类不能为空");
        if (sellerId == null) throw new BusinessException("必须指定卖家 ID");
        // 卖家名下商品名忽略大小写查重：如 "iPhone 15"/"iphone 15"/" iPhone 15 " 视为冲突
        if (productDao.findBySellerIdAndNameIgnoreCase(sellerId, cleanName).isPresent()) {
            throw new BusinessException("您已上架过同名商品");
        }
        Product p = new Product(null, cleanName, price, stock, category, sellerId);
        return productDao.save(p);
    }

    public Product getById(Long id) {
        if (id == null) throw new BusinessException("商品 ID 不能为空");
        return productDao.findById(id)
                .orElseThrow(() -> new BusinessException(404, "商品不存在"));
    }

    public List<Product> listAll() {
        return productDao.findAll();
    }

    public List<Product> listByCategory(String category) {
        if (category == null) throw new BusinessException("分类不能为空");
        return productDao.findByCategory(category);
    }

    /**
     * 搜索商品（分页 + 关键字模糊 + 分类 + 卖家筛选）
     * @param keyword 关键字（可空）
     * @param category 分类（可空）
     * @param sellerId 卖家ID（可空）
     * @param page 页码，从 1 开始
     * @param size 每页条数
     * @return {total, list, page, size}
     */
    public Map<String, Object> search(String keyword, String category, Long sellerId, int page, int size) {
        if (page < 1) page = 1;
        if (size < 1) size = 10;
        if (size > 100) size = 100;
        List<Product> all = productDao.search(keyword, category, sellerId);
        int total = all.size();
        int from = (page - 1) * size;
        List<Product> sub;
        if (from >= total) {
            sub = Collections.emptyList();
        } else {
            int to = Math.min(from + size, total);
            sub = all.subList(from, to);
        }
        Map<String, Object> res = new HashMap<>();
        res.put("total", total);
        res.put("page", page);
        res.put("size", size);
        res.put("totalPages", (total + size - 1) / size);
        res.put("list", sub);
        return res;
    }

    /** 上架/下架 */
    public Product setStatus(Long id, Integer status, Long operatorId) {
        if (status != 0 && status != 1) throw new BusinessException("状态不合法");
        if (operatorId == null) throw new BusinessException(403, "无操作权限");
        Product p = getById(id);
        p.setStatus(status);
        return productDao.save(p);
    }

    /** 更新价格 */
    public Product updatePrice(Long id, Integer newPrice) {
        if (newPrice == null || newPrice <= 0) throw new BusinessException("新价格不合法");
        Product p = getById(id);
        p.setPrice(newPrice);
        return productDao.save(p);
    }

    /** 扣库存（下单时调用） */
    public void deductStock(Long productId, int quantity) {
        if (quantity <= 0) throw new BusinessException("购买数量必须为正");
        Product p = getById(productId);
        if (p.getStatus() != 1) throw new BusinessException("商品已下架");
        boolean ok = productDao.deductStock(productId, quantity);
        if (!ok) throw new BusinessException("库存不足");
    }

    /** 回滚库存（取消订单/退款时） */
    public void rollbackStock(Long productId, int quantity) {
        if (quantity <= 0) return;
        productDao.rollbackStock(productId, quantity);
    }
}
