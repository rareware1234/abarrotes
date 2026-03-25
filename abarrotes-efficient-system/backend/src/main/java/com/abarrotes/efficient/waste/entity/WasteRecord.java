package com.abarrotes.efficient.waste.entity;

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
    private Long inventoryItemId; // Referencia al lote específico

    @NotNull
    private BigDecimal quantityWasted;

    @NotNull
    private String reason; // Ej: "CADUCADO", "DAÑADO", "EXCESO_INVENTARIO", "ERROR_EMPLEADO"

    @NotNull
    private LocalDateTime wasteDate;

    @NotNull
    private String recordedBy; // ID del empleado o sistema que registra

    private String notes;
}