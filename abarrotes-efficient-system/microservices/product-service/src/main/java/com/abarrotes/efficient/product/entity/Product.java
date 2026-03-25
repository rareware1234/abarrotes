package com.abarrotes.efficient.product.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(unique = true, nullable = false)
    private String sku;

    @Column(unique = true)
    private String barcode;

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

    public Product() {}

    // Getters
    public Long getId() { return id; }
    public String getSku() { return sku; }
    public String getBarcode() { return barcode; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getCategory() { return category; }
    public String getUnitMeasure() { return unitMeasure; }
    public BigDecimal getPrice() { return price; }
    public BigDecimal getMemberPrice() { return memberPrice; }
    public Boolean getIsActive() { return isActive; }
    public Integer getMinStock() { return minStock; }
    public Integer getMaxStock() { return maxStock; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setSku(String sku) { this.sku = sku; }
    public void setBarcode(String barcode) { this.barcode = barcode; }
    public void setName(String name) { this.name = name; }
    public void setDescription(String description) { this.description = description; }
    public void setCategory(String category) { this.category = category; }
    public void setUnitMeasure(String unitMeasure) { this.unitMeasure = unitMeasure; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setMemberPrice(BigDecimal memberPrice) { this.memberPrice = memberPrice; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public void setMinStock(Integer minStock) { this.minStock = minStock; }
    public void setMaxStock(Integer maxStock) { this.maxStock = maxStock; }
}