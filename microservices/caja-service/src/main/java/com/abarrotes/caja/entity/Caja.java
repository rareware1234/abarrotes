package com.abarrotes.caja.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cajas")
public class Caja {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre; // Ej: "Caja Principal"

    @Enumerated(EnumType.STRING)
    private EstadoCaja estado;

    private BigDecimal montoInicial;
    private BigDecimal montoFinal;
    private BigDecimal totalVentas;

    private Long empleadoId; // ID del empleado que abrió la caja
    private String empleadoNombre;

    private LocalDateTime apertura;
    private LocalDateTime cierre;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Caja() {}

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public EstadoCaja getEstado() { return estado; }
    public void setEstado(EstadoCaja estado) { this.estado = estado; }
    public BigDecimal getMontoInicial() { return montoInicial; }
    public void setMontoInicial(BigDecimal montoInicial) { this.montoInicial = montoInicial; }
    public BigDecimal getMontoFinal() { return montoFinal; }
    public void setMontoFinal(BigDecimal montoFinal) { this.montoFinal = montoFinal; }
    public BigDecimal getTotalVentas() { return totalVentas; }
    public void setTotalVentas(BigDecimal totalVentas) { this.totalVentas = totalVentas; }
    public Long getEmpleadoId() { return empleadoId; }
    public void setEmpleadoId(Long empleadoId) { this.empleadoId = empleadoId; }
    public String getEmpleadoNombre() { return empleadoNombre; }
    public void setEmpleadoNombre(String empleadoNombre) { this.empleadoNombre = empleadoNombre; }
    public LocalDateTime getApertura() { return apertura; }
    public void setApertura(LocalDateTime apertura) { this.apertura = apertura; }
    public LocalDateTime getCierre() { return cierre; }
    public void setCierre(LocalDateTime cierre) { this.cierre = cierre; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
