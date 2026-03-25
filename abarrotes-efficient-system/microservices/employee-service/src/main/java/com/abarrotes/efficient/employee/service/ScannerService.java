package com.abarrotes.efficient.employee.service;

import com.abarrotes.efficient.employee.client.ProductServiceClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class ScannerService {

    @Autowired
    private ProductServiceClient productClient;

    public Map<String, Object> getProductByBarcode(String barcode) {
        return productClient.getProductByBarcode(barcode);
    }
}