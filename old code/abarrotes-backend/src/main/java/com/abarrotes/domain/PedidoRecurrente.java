package com.abarrotes.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PedidoRecurrente {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    private Usuario usuario;
    @Enumerated(EnumType.STRING)
    private Frecuencia frecuencia; // SEMANAL, QUINCENAL, MENSUAL
    private LocalDate fechaInicio;
    private LocalDate proximaFecha;
    @Enumerated(EnumType.STRING)
    private Estado estado; // ACTIVO, PAUSADO, CANCELADO

    @OneToMany(mappedBy = "recurrente", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PedidoRecurrenteItem> items = new ArrayList<>();

    public enum Frecuencia { SEMANAL, QUINCENAL, MENSUAL }
    public enum Estado { ACTIVO, PAUSADO, CANCELADO }
}
