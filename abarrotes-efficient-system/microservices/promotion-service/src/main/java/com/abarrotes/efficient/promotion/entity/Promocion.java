package com.abarrotes.efficient.promotion.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "promociones")
public class Promocion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long productoId;

    @Column(nullable = false)
    @JsonProperty("nombre")
    private String nombreProducto;

    @Column(nullable = false)
    private String tipo; // "2x1", "DESCUENTO", "LIQUIDACION"

    @Column(nullable = false)
    private Double valor; // Ej: 20.0 (20% descuento) o 2.0 (2x1)

    @Column(nullable = false)
    private LocalDateTime fechaInicio;

    @Column(nullable = false)
    private LocalDateTime fechaFin;

    @Column(nullable = false)
    private Boolean activa = true;

    @Column(length = 500)
    @JsonProperty("razon")
    private String razonGeneracion; // "Stock alto", "Cerca caducidad"

    // Constructor vacío para JPA
    public Promocion() {}

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProductoId() { return productoId; }
    public void setProductoId(Long productoId) { this.productoId = productoId; }
    public String getNombreProducto() { return nombreProducto; }
    public void setNombreProducto(String nombreProducto) { this.nombreProducto = nombreProducto; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public Double getValor() { return valor; }
    public void setValor(Double valor) { this.valor = valor; }
    public LocalDateTime getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDateTime fechaInicio) { this.fechaInicio = fechaInicio; }
    public LocalDateTime getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDateTime fechaFin) { this.fechaFin = fechaFin; }
    public Boolean getActiva() { return activa; }
    public void setActiva(Boolean activa) { this.activa = activa; }
    public String getRazonGeneracion() { return razonGeneracion; }
    public void setRazonGeneracion(String razonGeneracion) { this.razonGeneracion = razonGeneracion; }
}