package com.abarrotes.efficient.employee.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;

@FeignClient(name = "product-service", url = "http://product-service:8081")
public interface ProductServiceClient {

    @GetMapping("/api/products/barcode/{barcode}")
    Map<String, Object> getProductByBarcode(@PathVariable("barcode") String barcode);
}