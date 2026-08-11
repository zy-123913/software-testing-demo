package com.example.dao.impl;

import com.example.dao.ProductDao;
import com.example.entity.Product;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

public class InMemoryProductDao implements ProductDao {
    private final Map<Long, Product> store = new ConcurrentHashMap<>();
    private final AtomicLong idSeq = new AtomicLong(2000);

    @Override
    public Product save(Product product) {
        if (product.getId() == null) {
            product.setId(idSeq.incrementAndGet());
            product.setCreatedAt(System.currentTimeMillis());
        }
        store.put(product.getId(), product);
        return product;
    }

    @Override
    public Optional<Product> findById(Long id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public List<Product> findAll() {
        return new ArrayList<>(store.values());
    }

    @Override
    public List<Product> findByCategory(String category) {
        return store.values().stream()
                .filter(p -> category != null && category.equals(p.getCategory()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Product> findBySellerId(Long sellerId) {
        return store.values().stream()
                .filter(p -> sellerId != null && sellerId.equals(p.getSellerId()))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Product> findBySellerIdAndNameIgnoreCase(Long sellerId, String name) {
        if (sellerId == null || name == null) return Optional.empty();
        final String key = name.trim().toLowerCase(Locale.ROOT);
        return store.values().stream()
                .filter(p -> sellerId.equals(p.getSellerId()))
                .filter(p -> p.getName() != null && key.equals(p.getName().trim().toLowerCase(Locale.ROOT)))
                .findFirst();
    }

    @Override
    public List<Product> search(String keyword, String category, Long sellerId) {
        final String kw = (keyword == null) ? null : keyword.trim().toLowerCase(Locale.ROOT);
        return store.values().stream()
                .filter(p -> category == null || category.isEmpty() || category.equals(p.getCategory()))
                .filter(p -> sellerId == null || sellerId.equals(p.getSellerId()))
                .filter(p -> kw == null || kw.isEmpty()
                        || (p.getName() != null && p.getName().toLowerCase(Locale.ROOT).contains(kw)))
                .sorted(Comparator.comparing(Product::getId).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public boolean deleteById(Long id) {
        return store.remove(id) != null;
    }

    @Override
    public synchronized boolean deductStock(Long productId, int quantity) {
        Product p = store.get(productId);
        if (p == null) return false;
        if (p.getStock() < quantity) return false;
        p.setStock(p.getStock() - quantity);
        return true;
    }

    @Override
    public synchronized void rollbackStock(Long productId, int quantity) {
        Product p = store.get(productId);
        if (p != null) {
            p.setStock(p.getStock() + quantity);
        }
    }
}
