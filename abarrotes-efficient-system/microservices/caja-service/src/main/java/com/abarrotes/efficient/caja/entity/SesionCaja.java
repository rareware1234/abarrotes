package com.abarrotes.efficient.caja.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sesiones_caja")
public class SesionCaja {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String numeroEmpleado;

    @Column(nullable = false)
    private LocalDateTime fechaApertura;

    private LocalDateTime fechaCierre;

    @Column(nullable = false)
    private Double montoApertura;

    private Double montoCierre;

    private Double diferencia;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private EstadoCaja estado;

    public enum EstadoCaja {
        ABIERTA,
        CERRADA
    }
    
    // Constructor para apertura
    public SesionCaja(String numeroEmpleado, Double montoApertura) {
        this.numeroEmpleado = numeroEmpleado;
        this.montoApertura = montoApertura;
        this.fechaApertura = LocalDateTime.now();
        this.estado = EstadoCaja.ABIERTA;
    }
    
    public SesionCaja() {}

    // Getters
    public Long getId() { return id; }
    public String getNumeroEmpleado() { return numeroEmpleado; }
    public LocalDateTime getFechaApertura() { return fechaApertura; }
    public LocalDateTime getFechaCierre() { return fechaCierre; }
    public Double getMontoApertura() { return montoApertura; }
    public Double getMontoCierre() { return montoCierre; }
    public Double getDiferencia() { return diferencia; }
    public EstadoCaja getEstado() { return estado; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setNumeroEmpleado(String numeroEmpleado) { this.numeroEmpleado = numeroEmpleado; }
    public void setFechaApertura(LocalDateTime fechaApertura) { this.fechaApertura = fechaApertura; }
    public void setFechaCierre(LocalDateTime fechaCierre) { this.fechaCierre = fechaCierre; }
    public void setMontoApertura(Double montoApertura) { this.montoApertura = montoApertura; }
    public void setMontoCierre(Double montoCierre) { this.montoCierre = montoCierre; }
    public void setDiferencia(Double diferencia) { this.diferencia = diferencia; }
    public void setEstado(EstadoCaja estado) { this.estado = estado; }
}