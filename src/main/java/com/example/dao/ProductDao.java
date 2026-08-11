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
    boolean deleteById(Long id);
    /** 扣减库存，成功返回 true，库存不足返回 false */
    boolean deductStock(Long productId, int quantity);
    /** 回滚库存（取消订单时） */
    void rollbackStock(Long productId, int quantity);
}
