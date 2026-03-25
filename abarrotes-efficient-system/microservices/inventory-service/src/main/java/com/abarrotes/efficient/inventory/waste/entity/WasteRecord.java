package com.abarrotes.efficient.inventory.waste.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "waste_records")
public class WasteRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private Long productId;

    @NotNull
    private Long inventoryItemId;

    @NotNull
    private BigDecimal quantityWasted;

    @NotNull
    private String reason;

    @NotNull
    private LocalDateTime wasteDate;

    @NotNull
    private String recordedBy;

    private String notes;

    public WasteRecord() {}

    // Getters
    public Long getId() { return id; }
    public Long getProductId() { return productId; }
    public Long getInventoryItemId() { return inventoryItemId; }
    public BigDecimal getQuantityWasted() { return quantityWasted; }
    public String getReason() { return reason; }
    public LocalDateTime getWasteDate() { return wasteDate; }
    public String getRecordedBy() { return recordedBy; }
    public String getNotes() { return notes; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setProductId(Long productId) { this.productId = productId; }
    public void setInventoryItemId(Long inventoryItemId) { this.inventoryItemId = inventoryItemId; }
    public void setQuantityWasted(BigDecimal quantityWasted) { this.quantityWasted = quantityWasted; }
    public void setReason(String reason) { this.reason = reason; }
    public void setWasteDate(LocalDateTime wasteDate) { this.wasteDate = wasteDate; }
    public void setRecordedBy(String recordedBy) { this.recordedBy = recordedBy; }
    public void setNotes(String notes) { this.notes = notes; }
}