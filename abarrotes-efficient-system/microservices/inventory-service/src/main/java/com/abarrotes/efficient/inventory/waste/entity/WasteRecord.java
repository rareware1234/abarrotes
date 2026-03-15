package com.abarrotes.efficient.inventory.waste.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "waste_records")
@Data
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
}