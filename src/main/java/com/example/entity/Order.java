package com.example.entity;

/**
 * 订单实体：电商交易订单
 */
public class Order {
    private Long id;
    private String orderNo;
    private Long buyerId;
    private Long productId;
    private Integer quantity;
    /** 订单总价（分） */
    private Integer totalAmount;
    /** 订单状态：PENDING 待付款 / PAID 已付款 / SHIPPED 已发货 / COMPLETED 已完成 / CANCELLED 已取消 / REFUNDED 已退款 */
    private String status;
    private String shippingAddress;
    private Long paidAt;
    private Long shippedAt;
    private Long completedAt;
    private Long refundedAt;
    private Long createdAt;
    private Long updatedAt;

    public Order() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; touch(); }
    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; touch(); }
    public Long getBuyerId() { return buyerId; }
    public void setBuyerId(Long buyerId) { this.buyerId = buyerId; touch(); }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; touch(); }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; touch(); }
    public Integer getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Integer totalAmount) { this.totalAmount = totalAmount; touch(); }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; touch(); }
    public String getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(String shippingAddress) { this.shippingAddress = shippingAddress; touch(); }
    public Long getPaidAt() { return paidAt; }
    public void setPaidAt(Long paidAt) { this.paidAt = paidAt; touch(); }
    public Long getShippedAt() { return shippedAt; }
    public void setShippedAt(Long shippedAt) { this.shippedAt = shippedAt; touch(); }
    public Long getCompletedAt() { return completedAt; }
    public void setCompletedAt(Long completedAt) { this.completedAt = completedAt; touch(); }
    public Long getRefundedAt() { return refundedAt; }
    public void setRefundedAt(Long refundedAt) { this.refundedAt = refundedAt; touch(); }
    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }
    public Long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Long updatedAt) { this.updatedAt = updatedAt; }

    private void touch() { this.updatedAt = System.currentTimeMillis(); }
}
