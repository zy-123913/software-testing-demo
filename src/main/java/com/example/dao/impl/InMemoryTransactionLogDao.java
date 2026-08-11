package com.example.dao.impl;

import com.example.dao.TransactionLogDao;
import com.example.entity.TransactionLog;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

public class InMemoryTransactionLogDao implements TransactionLogDao {
    private final Map<Long, TransactionLog> store = new ConcurrentHashMap<>();
    private final AtomicLong idSeq = new AtomicLong(5000);

    @Override
    public TransactionLog save(TransactionLog log) {
        if (log.getId() == null) log.setId(idSeq.incrementAndGet());
        if (log.getCreatedAt() == null) log.setCreatedAt(System.currentTimeMillis());
        store.put(log.getId(), log);
        return log;
    }

    @Override
    public List<TransactionLog> findByUserId(Long userId) {
        return store.values().stream()
                .filter(t -> userId != null && userId.equals(t.getUserId()))
                .sorted(Comparator.comparing(TransactionLog::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<TransactionLog> findAll() {
        return new ArrayList<>(store.values());
    }
}
