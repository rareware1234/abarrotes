package com.abarrotes.efficient.inventory.waste.service;

import com.abarrotes.efficient.inventory.entity.InventoryItem;
import com.abarrotes.efficient.inventory.repository.InventoryRepository;
import com.abarrotes.efficient.inventory.waste.entity.WasteRecord;
import com.abarrotes.efficient.inventory.waste.repository.WasteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WasteService {

    private final WasteRepository wasteRepository;
    private final InventoryRepository inventoryRepository;

    @Transactional
    public WasteRecord recordWaste(WasteRecord wasteRecord) {
        wasteRecord.setWasteDate(LocalDateTime.now());
        
        // Reducir el stock del lote específico
        Optional<InventoryItem> itemOpt = inventoryRepository.findById(wasteRecord.getInventoryItemId());
        if (itemOpt.isPresent()) {
            InventoryItem item = itemOpt.get();
            // Validar que no se intente desperdiciar más de lo disponible
            if (item.getQuantity().compareTo(wasteRecord.getQuantityWasted()) >= 0) {
                item.setQuantity(item.getQuantity().subtract(wasteRecord.getQuantityWasted()));
                inventoryRepository.save(item);
            } else {
                throw new IllegalArgumentException("Cantidad de merma excede el stock del lote");
            }
        } else {
            throw new IllegalArgumentException("Lote de inventario no encontrado");
        }
        
        return wasteRepository.save(wasteRecord);
    }
}