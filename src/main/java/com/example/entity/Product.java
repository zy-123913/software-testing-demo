package com.example.entity;

/**
 * 商品实体：电商系统中的 SKU
 */
public class Product {
    private Long id;
    private String name;
    private String description;
    /** 价格（单位：分） */
    private Integer price;
    private Integer stock;
    /** 分类：如 电子产品/服装/食品 */
    private String category;
    private Long sellerId;
    /** 状态：0 下架，1 在售 */
    private Integer status;
    private Long createdAt;
    private Long updatedAt;

    public Product() {}

    public Product(Long id, String name, Integer price, Integer stock, String category, Long sellerId) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.stock = stock;
        this.category = category;
        this.sellerId = sellerId;
        this.status = 1;
        this.createdAt = System.currentTimeMillis();
        this.updatedAt = this.createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; this.updatedAt = System.currentTimeMillis(); }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; this.updatedAt = System.currentTimeMillis(); }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; this.updatedAt = System.currentTimeMillis(); }
    public Integer getPrice() { return price; }
    public void setPrice(Integer price) { this.price = price; this.updatedAt = System.currentTimeMillis(); }
    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; this.updatedAt = System.currentTimeMillis(); }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; this.updatedAt = System.currentTimeMillis(); }
    public Long getSellerId() { return sellerId; }
    public void setSellerId(Long sellerId) { this.sellerId = sellerId; this.updatedAt = System.currentTimeMillis(); }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; this.updatedAt = System.currentTimeMillis(); }
    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }
    public Long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Long updatedAt) { this.updatedAt = updatedAt; }
}
