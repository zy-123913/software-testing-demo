package com.example.dao.impl;

import com.example.dao.OrderDao;
import com.example.entity.Order;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

public class InMemoryOrderDao implements OrderDao {
    private final Map<Long, Order> store = new ConcurrentHashMap<>();
    private final AtomicLong idSeq = new AtomicLong(3000);

    @Override
    public Order save(Order order) {
        if (order.getId() == null) {
            order.setId(idSeq.incrementAndGet());
            order.setCreatedAt(System.currentTimeMillis());
        }
        store.put(order.getId(), order);
        return order;
    }

    @Override
    public Optional<Order> findById(Long id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public Optional<Order> findByOrderNo(String orderNo) {
        return store.values().stream()
                .filter(o -> orderNo != null && orderNo.equals(o.getOrderNo()))
                .findFirst();
    }

    @Override
    public List<Order> findByBuyerId(Long buyerId) {
        return store.values().stream()
                .filter(o -> buyerId != null && buyerId.equals(o.getBuyerId()))
                .sorted(Comparator.comparingLong(Order::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<Order> findByStatus(String status) {
        return store.values().stream()
                .filter(o -> status != null && status.equals(o.getStatus()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Order> findAll() {
        return new ArrayList<>(store.values());
    }

    @Override
    public boolean updateStatus(Long orderId, String newStatus) {
        Order o = store.get(orderId);
        if (o == null) return false;
        o.setStatus(newStatus);
        return true;
    }
}
