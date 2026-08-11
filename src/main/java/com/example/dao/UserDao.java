package com.example.dao;

import com.example.entity.User;
import java.util.List;
import java.util.Optional;

/**
 * 用户数据访问层接口（可替换为 MySQL/MyBatis 实现）
 */
public interface UserDao {
    User save(User user);
    Optional<User> findById(Long id);
    Optional<User> findByUsername(String username);
    /** 用户名忽略大小写查重 */
    Optional<User> findByUsernameIgnoreCase(String username);
    List<User> findAll();
    boolean deleteById(Long id);
    List<User> findByRole(String role);
}
