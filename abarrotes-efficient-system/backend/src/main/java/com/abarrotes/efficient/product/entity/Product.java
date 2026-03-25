package com.abarrotes.efficient.product.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "products")
@Data
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(unique = true, nullable = false)
    private String sku;

    @NotBlank
    private String name;

    @NotNull
    private String description;

    @NotNull
    private String category; // Ej: "Frescos", "Abarrotes", "Limpieza"

    @NotNull
    private String unitMeasure; // Unidad de medida base: "KG", "L", "PIEZA", "PAQUETE"

    @NotNull
    private BigDecimal price;

    @NotNull
    private BigDecimal memberPrice;

    @NotNull
    private Boolean isActive = true;

    // Para control de merma: punto de reorden y stock mínimo
    private Integer minStock;
    private Integer maxStock;
}