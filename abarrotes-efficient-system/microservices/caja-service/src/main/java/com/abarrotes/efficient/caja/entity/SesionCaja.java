package com.abarrotes.efficient.caja.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "sesiones_caja")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SesionCaja {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String numeroEmpleado;

    @Column(nullable = false)
    private java.time.LocalDateTime fechaApertura;

    private java.time.LocalDateTime fechaCierre;

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
        this.fechaApertura = java.time.LocalDateTime.now();
        this.estado = EstadoCaja.ABIERTA;
    }
}