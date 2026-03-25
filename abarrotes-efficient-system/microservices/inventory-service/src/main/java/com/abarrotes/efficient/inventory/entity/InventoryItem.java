package com.abarrotes.efficient.inventory.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_items")
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

    public InventoryItem() {}

    // Getters
    public Long getId() { return id; }
    public Long getProductId() { return productId; }
    public String getBatchNumber() { return batchNumber; }
    public BigDecimal getQuantity() { return quantity; }
    public LocalDateTime getEntryDate() { return entryDate; }
    public LocalDateTime getExpiryDate() { return expiryDate; }
    public BigDecimal getUnitCost() { return unitCost; }
    public Integer getFreshnessScore() { return freshnessScore; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setProductId(Long productId) { this.productId = productId; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public void setEntryDate(LocalDateTime entryDate) { this.entryDate = entryDate; }
    public void setExpiryDate(LocalDateTime expiryDate) { this.expiryDate = expiryDate; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }
    public void setFreshnessScore(Integer freshnessScore) { this.freshnessScore = freshnessScore; }
}