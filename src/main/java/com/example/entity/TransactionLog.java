package com.example.entity;

/**
 * 账户流水：记录用户余额变动
 *  类型：RECHARGE 充值 / PAY 消费 / REFUND 退款 / CANCEL_REFUND 取消退款(取消订单回余额)
 */
public class TransactionLog {
    private Long id;
    private Long userId;
    /** 变动类型 */
    private String type;
    /** 变动金额（分，正数入账，负数出账） */
    private Integer amount;
    /** 变动后余额（分） */
    private Long balanceAfter;
    /** 关联订单号（充值时可为空） */
    private String refNo;
    /** 备注 */
    private String remark;
    private Long createdAt;

    public TransactionLog() {}

    public TransactionLog(Long userId, String type, Integer amount, Long balanceAfter, String refNo, String remark) {
        this.userId = userId;
        this.type = type;
        this.amount = amount;
        this.balanceAfter = balanceAfter;
        this.refNo = refNo;
        this.remark = remark;
        this.createdAt = System.currentTimeMillis();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Integer getAmount() { return amount; }
    public void setAmount(Integer amount) { this.amount = amount; }
    public Long getBalanceAfter() { return balanceAfter; }
    public void setBalanceAfter(Long balanceAfter) { this.balanceAfter = balanceAfter; }
    public String getRefNo() { return refNo; }
    public void setRefNo(String refNo) { this.refNo = refNo; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }
}
