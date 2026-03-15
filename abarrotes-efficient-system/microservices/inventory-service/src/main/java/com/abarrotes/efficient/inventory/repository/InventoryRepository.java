package com.abarrotes.efficient.inventory.repository;

import com.abarrotes.efficient.inventory.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InventoryRepository extends JpaRepository<InventoryItem, Long> {
    
    // Buscar stock por producto (ordenado por fecha de entrada para FIFO)
    List<InventoryItem> findByProductIdOrderByEntryDateAsc(Long productId);

    // Consulta nativa para optimizar rendimiento en grandes volúmenes
    @Query(value = "SELECT * FROM inventory_items WHERE product_id = :productId AND quantity > 0 ORDER BY expiry_date ASC", nativeQuery = true)
    List<InventoryItem> findActiveStockByProductExpiry(@Param("productId") Long productId);
}