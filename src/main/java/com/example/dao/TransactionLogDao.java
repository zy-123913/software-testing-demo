package com.example.dao;

import com.example.entity.TransactionLog;
import java.util.List;

public interface TransactionLogDao {
    TransactionLog save(TransactionLog log);
    List<TransactionLog> findByUserId(Long userId);
    List<TransactionLog> findAll();
}
