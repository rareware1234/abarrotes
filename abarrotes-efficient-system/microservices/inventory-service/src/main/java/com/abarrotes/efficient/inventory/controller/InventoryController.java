package com.abarrotes.efficient.inventory.controller;

import com.abarrotes.efficient.inventory.entity.InventoryItem;
import com.abarrotes.efficient.inventory.service.InventoryService;
import com.abarrotes.efficient.inventory.waste.entity.WasteRecord;
import com.abarrotes.efficient.inventory.waste.service.WasteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;
    
    @Autowired
    private WasteService wasteService;

    @GetMapping("/inventory/stock/{productId}")
    public ResponseEntity<BigDecimal> getStock(@PathVariable Long productId) {
        return ResponseEntity.ok(inventoryService.getAvailableStock(productId));
    }

    @PostMapping("/inventory/receive")
    public ResponseEntity<InventoryItem> receiveStock(
            @RequestParam Long productId,
            @RequestParam BigDecimal quantity,
            @RequestParam BigDecimal unitCost,
            @RequestParam LocalDateTime expiryDate) {
        try {
            InventoryItem item = inventoryService.receiveStock(productId, quantity, unitCost, expiryDate);
            return ResponseEntity.ok(item);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/waste")
    public ResponseEntity<WasteRecord> recordWaste(@RequestBody WasteRecord wasteRecord) {
        try {
            WasteRecord savedWaste = wasteService.recordWaste(wasteRecord);
            return ResponseEntity.ok(savedWaste);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/inventory/all")
    public ResponseEntity<List<InventoryItem>> getAllInventory() {
        try {
            return ResponseEntity.ok(inventoryService.getAllInventoryItems());
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Inventory Service is running");
    }
}