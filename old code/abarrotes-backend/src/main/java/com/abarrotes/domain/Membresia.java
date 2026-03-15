package com.abarrotes.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Membresia {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne
    private Usuario usuario;
    @Enumerated(EnumType.STRING)
    private Tipo tipo; // MENSUAL, ANUAL
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    @Enumerated(EnumType.STRING)
    private Estado estado; // ACTIVA, CANCELADA, PENDIENTE
    public enum Tipo { MENSUAL, ANUAL }
    public enum Estado { ACTIVA, CANCELADA, PENDIENTE }
}
