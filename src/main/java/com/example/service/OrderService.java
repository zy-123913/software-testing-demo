package com.example.service;

import com.example.dao.OrderDao;
import com.example.entity.Order;
import com.example.entity.Product;
import com.example.entity.User;
import com.example.common.BusinessException;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 订单服务：下单、支付、发货、收货、取消、退款等订单全生命周期管理
 *
 * 编排 UserService + ProductService + OrderDao 完成事务性操作。
 * 生产环境可替换为 Spring 事务 + MySQL，此处以显式的"校验→扣库存→扣余额→创建订单"链路展示业务逻辑。
 */
public class OrderService {

    private final OrderDao orderDao;
    private final UserService userService;
    private final ProductService productService;

    private final AtomicInteger seq = new AtomicInteger(1);

    public OrderService(OrderDao orderDao, UserService userService, ProductService productService) {
        this.orderDao = orderDao;
        this.userService = userService;
        this.productService = productService;
    }

    /**
     * 创建订单（买家下单）
     * 事务链路：校验商品 → 校验买家 → 扣库存 → 扣余额 → 创建订单
     */
    public Order create(Long buyerId, Long productId, Integer quantity, String shippingAddress) {
        if (buyerId == null) throw new BusinessException("买家 ID 不能为空");
        if (productId == null) throw new BusinessException("商品 ID 不能为空");
        if (quantity == null || quantity <= 0) throw new BusinessException("购买数量必须为正");
        if (shippingAddress == null || shippingAddress.trim().isEmpty()) throw new BusinessException("收货地址不能为空");

        Product product = productService.getById(productId);
        User buyer = userService.getById(buyerId);

        // 1. 先扣库存
        productService.deductStock(productId, quantity);

        // 2. 计算总价
        int total = product.getPrice() * quantity;

        // 3. 扣余额，余额不足 → 回滚库存
        try {
            userService.deductBalance(buyerId, total);
        } catch (BusinessException e) {
            productService.rollbackStock(productId, quantity);
            throw e;
        }

        // 4. 创建订单
        Order o = new Order();
        o.setBuyerId(buyerId);
        o.setProductId(productId);
        o.setQuantity(quantity);
        o.setTotalAmount(total);
        o.setShippingAddress(shippingAddress);
        o.setStatus("PAID"); // 余额扣款即视为已支付
        o.setOrderNo(generateOrderNo());
        o.setPaidAt(System.currentTimeMillis());
        return orderDao.save(o);
    }

    /** 卖家发货 */
    public Order ship(Long orderId, Long sellerId) {
        Order o = requireOwnedBySeller(orderId, sellerId);
        if (!"PAID".equals(o.getStatus())) throw new BusinessException("只有待发货订单可发货");
        o.setStatus("SHIPPED");
        o.setShippedAt(System.currentTimeMillis());
        return orderDao.save(o);
    }

    /** 买家确认收货 */
    public Order complete(Long orderId, Long buyerId) {
        Order o = getById(orderId);
        if (!buyerId.equals(o.getBuyerId())) throw new BusinessException(403, "非订单买家");
        if (!"SHIPPED".equals(o.getStatus())) throw new BusinessException("只有已发货订单可确认收货");
        o.setStatus("COMPLETED");
        o.setCompletedAt(System.currentTimeMillis());
        return orderDao.save(o);
    }

    /** 取消订单（待付款/已付款可取消） */
    public Order cancel(Long orderId, Long operatorId) {
        Order o = getById(orderId);
        if (!("PENDING".equals(o.getStatus()) || "PAID".equals(o.getStatus()))) {
            throw new BusinessException("当前状态不可取消");
        }
        if (!operatorId.equals(o.getBuyerId())) {
            User op = userService.getById(operatorId);
            if (!"ADMIN".equals(op.getRole())) throw new BusinessException(403, "无取消权限");
        }
        // 已付款则退款（余额+库存回滚）
        if ("PAID".equals(o.getStatus())) {
            productService.rollbackStock(o.getProductId(), o.getQuantity());
            userService.recharge(o.getBuyerId(), o.getTotalAmount());
        }
        o.setStatus("CANCELLED");
        return orderDao.save(o);
    }

    public Order getById(Long id) {
        if (id == null) throw new BusinessException("订单 ID 不能为空");
        return orderDao.findById(id)
                .orElseThrow(() -> new BusinessException(404, "订单不存在"));
    }

    public List<Order> listByBuyer(Long buyerId) {
        if (buyerId == null) throw new BusinessException("买家 ID 不能为空");
        return orderDao.findByBuyerId(buyerId);
    }

    public List<Order> listByStatus(String status) {
        if (status == null) throw new BusinessException("状态不能为空");
        return orderDao.findByStatus(status);
    }

    public List<Order> listAll() {
        return orderDao.findAll();
    }

    // ================= 内部工具 =================

    private Order requireOwnedBySeller(Long orderId, Long sellerId) {
        Order o = getById(orderId);
        Product p = productService.getById(o.getProductId());
        if (!sellerId.equals(p.getSellerId())) throw new BusinessException(403, "非商品卖家");
        return o;
    }

    private String generateOrderNo() {
        String ts = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());
        int s = seq.getAndIncrement();
        return "NO" + ts + String.format("%05d", s);
    }
}
