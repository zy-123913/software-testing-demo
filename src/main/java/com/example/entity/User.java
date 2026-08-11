package com.example.entity;

/**
 * 用户实体：电商系统用户（买家/卖家）
 */
public class User {
    private Long id;
    private String username;
    private String password;
    private String email;
    private String phone;
    /** 用户角色：ADMIN / BUYER / SELLER */
    private String role;
    /** 账户余额（分） */
    private Long balance;
    /** 状态：0 禁用，1 启用 */
    private Integer status;
    private Long createdAt;
    private Long updatedAt;

    public User() {}

    public User(Long id, String username, String password, String email, String role) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.email = email;
        this.role = role;
        this.balance = 0L;
        this.status = 1;
        this.createdAt = System.currentTimeMillis();
        this.updatedAt = this.createdAt;
    }

    // getter / setter
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; this.updatedAt = System.currentTimeMillis(); }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; this.updatedAt = System.currentTimeMillis(); }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; this.updatedAt = System.currentTimeMillis(); }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; this.updatedAt = System.currentTimeMillis(); }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; this.updatedAt = System.currentTimeMillis(); }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; this.updatedAt = System.currentTimeMillis(); }
    public Long getBalance() { return balance; }
    public void setBalance(Long balance) { this.balance = balance; this.updatedAt = System.currentTimeMillis(); }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; this.updatedAt = System.currentTimeMillis(); }
    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }
    public Long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Long updatedAt) { this.updatedAt = updatedAt; }
}
