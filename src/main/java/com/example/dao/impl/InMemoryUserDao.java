package com.example.dao.impl;

import com.example.dao.UserDao;
import com.example.entity.User;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * 内存版 UserDao（演示/测试用，生产环境替换为 MyBatis 实现）
 */
public class InMemoryUserDao implements UserDao {
    private final Map<Long, User> store = new ConcurrentHashMap<>();
    private final AtomicLong idSeq = new AtomicLong(1000);

    @Override
    public User save(User user) {
        if (user.getId() == null) {
            user.setId(idSeq.incrementAndGet());
            user.setCreatedAt(System.currentTimeMillis());
        }
        store.put(user.getId(), user);
        return user;
    }

    @Override
    public Optional<User> findById(Long id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return store.values().stream()
                .filter(u -> username != null && username.equals(u.getUsername()))
                .findFirst();
    }

    @Override
    public Optional<User> findByUsernameIgnoreCase(String username) {
        if (username == null) return Optional.empty();
        final String key = username.trim().toLowerCase(Locale.ROOT);
        return store.values().stream()
                .filter(u -> u.getUsername() != null && key.equals(u.getUsername().trim().toLowerCase(Locale.ROOT)))
                .findFirst();
    }

    @Override
    public List<User> findAll() {
        return new ArrayList<>(store.values());
    }

    @Override
    public boolean deleteById(Long id) {
        return store.remove(id) != null;
    }

    @Override
    public List<User> findByRole(String role) {
        return store.values().stream()
                .filter(u -> role != null && role.equals(u.getRole()))
                .collect(Collectors.toList());
    }
}
