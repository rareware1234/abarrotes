package com.abarrotes.efficient.promotion.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Map;

@FeignClient(name = "inventory-service", url = "http://inventory-service:8082") // En Docker usa el nombre del servicio
public interface InventoryServiceClient {

    // Obtener todos los productos con su stock actual
    @GetMapping("/api/inventory/all")
    List<Map<String, Object>> getAllInventory();
}