package com.abarrotes.efficient.inventory.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_items")
@Data
public class InventoryItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private Long productId;

    @NotNull
    private String batchNumber; // Lote para FIFO y trazabilidad

    @NotNull
    private BigDecimal quantity; // Stock actual en unidad de medida base

    @NotNull
    private LocalDateTime entryDate; // Fecha de entrada al inventario

    @NotNull
    private LocalDateTime expiryDate; // Fecha de caducidad

    @NotNull
    private BigDecimal unitCost; // Costo de compra por unidad

    // Para optimización: qué tan cerca está de caducar (calculado por IA)
    private Integer freshnessScore; 
}