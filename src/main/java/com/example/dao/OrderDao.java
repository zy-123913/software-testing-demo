package com.example.dao;

import com.example.entity.Order;
import java.util.List;
import java.util.Optional;

public interface OrderDao {
    Order save(Order order);
    Optional<Order> findById(Long id);
    Optional<Order> findByOrderNo(String orderNo);
    List<Order> findByBuyerId(Long buyerId);
    List<Order> findByStatus(String status);
    List<Order> findAll();
    boolean updateStatus(Long orderId, String newStatus);
}
