package com.abarrotes.efficient.employee.controller;

import com.abarrotes.efficient.employee.service.ScannerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/scanner")
public class ScannerController {

    @Autowired
    private ScannerService scannerService;

    @GetMapping("/product/{barcode}")
    public ResponseEntity<Map<String, Object>> scanProduct(@PathVariable String barcode) {
        try {
            Map<String, Object> product = scannerService.getProductByBarcode(barcode);
            if (product != null) {
                return ResponseEntity.ok(product);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of("error", "Error communicating with product service"));
        }
    }
}