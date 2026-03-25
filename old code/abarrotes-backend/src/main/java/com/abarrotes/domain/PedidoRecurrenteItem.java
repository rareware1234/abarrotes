package com.abarrotes.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PedidoRecurrenteItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    private PedidoRecurrente recurrente;
    @ManyToOne
    private Producto producto;
    private Integer cantidad;
}
