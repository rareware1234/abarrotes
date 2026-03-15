package com.abarrotes.efficient.inventory.service;

import com.abarrotes.efficient.inventory.entity.InventoryItem;
import com.abarrotes.efficient.inventory.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;

    /**
     * Registra la entrada de stock (compra o recepción).
     * Lógica de eficiencia: Prioriza el uso de lotes más cercanos a la caducidad (FIFO).
     */
    @Transactional
    public InventoryItem receiveStock(Long productId, BigDecimal quantity, BigDecimal unitCost, LocalDateTime expiryDate) {
        InventoryItem item = new InventoryItem();
        item.setProductId(productId);
        item.setBatchNumber("BATCH-" + System.currentTimeMillis()); // Generador simple de lote
        item.setQuantity(quantity);
        item.setUnitCost(unitCost);
        item.setEntryDate(LocalDateTime.now());
        item.setExpiryDate(expiryDate);
        
        return inventoryRepository.save(item);
    }

    /**
     * Calcula el stock disponible total para un producto.
     * Considera solo lotes activos (no caducados y con cantidad > 0).
     */
    public BigDecimal getAvailableStock(Long productId) {
        List<InventoryItem> items = inventoryRepository.findByProductIdOrderByEntryDateAsc(productId);
        return items.stream()
                .filter(item -> item.getExpiryDate().isAfter(LocalDateTime.now()) && item.getQuantity().compareTo(BigDecimal.ZERO) > 0)
                .map(InventoryItem::getQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Reduce el stock al vender un producto.
     * Implementa estrategia FIFO (First In, First Out).
     * Retorna la cantidad que NO se pudo descontar (si no hay suficiente stock).
     */
    @Transactional
    public BigDecimal deductStock(Long productId, BigDecimal quantityToDeduct) {
        List<InventoryItem> activeItems = inventoryRepository.findActiveStockByProductExpiry(productId);
        BigDecimal remainingToDeduct = quantityToDeduct;

        for (InventoryItem item : activeItems) {
            if (remainingToDeduct.compareTo(BigDecimal.ZERO) <= 0) break;

            BigDecimal availableInBatch = item.getQuantity();
            BigDecimal deductFromBatch = availableInBatch.min(remainingToDeduct);

            item.setQuantity(availableInBatch.subtract(deductFromBatch));
            inventoryRepository.save(item);
            
            remainingToDeduct = remainingToDeduct.subtract(deductFromBatch);
        }

        return remainingToDeduct; // Si es > 0, hubo falta de stock
    }
}