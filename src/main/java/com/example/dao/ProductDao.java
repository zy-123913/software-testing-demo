package com.example.dao;

import com.example.entity.Product;
import java.util.List;
import java.util.Optional;

public interface ProductDao {
    Product save(Product product);
    Optional<Product> findById(Long id);
    List<Product> findAll();
    List<Product> findByCategory(String category);
    List<Product> findBySellerId(Long sellerId);
    /** 按卖家+商品名忽略大小写查重（上架重复拦截） */
    Optional<Product> findBySellerIdAndNameIgnoreCase(Long sellerId, String name);
    boolean deleteById(Long id);
    /** 扣减库存，成功返回 true，库存不足返回 false */
    boolean deductStock(Long productId, int quantity);
    /** 回滚库存（取消订单时） */
    void rollbackStock(Long productId, int quantity);

    /**
     * 通用搜索：按关键字模糊匹配商品名 + 按分类筛选
     * @param keyword 可为 null
     * @param category 可为 null
     * @param sellerId 可为 null
     */
    List<Product> search(String keyword, String category, Long sellerId);
}
