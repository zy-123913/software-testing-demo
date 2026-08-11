package com.example.service;

import com.example.dao.ProductDao;
import com.example.entity.Product;
import com.example.common.BusinessException;

import java.util.List;

/**
 * 商品服务：商品 CRUD + 库存管理
 */
public class ProductService {

    private final ProductDao productDao;

    public ProductService(ProductDao productDao) {
        this.productDao = productDao;
    }

    /** 新增商品 */
    public Product create(String name, Integer price, Integer stock, String category, Long sellerId) {
        if (name == null || name.trim().isEmpty()) throw new BusinessException("商品名不能为空");
        if (name.length() > 100) throw new BusinessException("商品名不能超过 100 字符");
        if (price == null || price <= 0) throw new BusinessException("价格必须为正数（单位：分）");
        if (stock == null || stock < 0) throw new BusinessException("库存不能为负数");
        if (category == null || category.isEmpty()) throw new BusinessException("分类不能为空");
        if (sellerId == null) throw new BusinessException("必须指定卖家 ID");
        Product p = new Product(null, name, price, stock, category, sellerId);
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

    /** 回滚库存（取消订单时） */
    public void rollbackStock(Long productId, int quantity) {
        if (quantity <= 0) return;
        productDao.rollbackStock(productId, quantity);
    }
}
