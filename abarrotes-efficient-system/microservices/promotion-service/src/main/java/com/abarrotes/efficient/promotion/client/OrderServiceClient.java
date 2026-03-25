package com.abarrotes.efficient.promotion.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;
import java.util.Map;

@FeignClient(name = "order-service", url = "http://order-service:8083")
public interface OrderServiceClient {

    // Obtener ventas recientes para analizar rotación
    @GetMapping("/api/orders/recent")
    List<Map<String, Object>> getRecentOrders();
}