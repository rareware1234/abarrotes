package com.abarrotes.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PedidoItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JsonIgnore
    private Pedido pedido;
    @ManyToOne
    private Producto producto;
    private Integer cantidad;
    private Double precioUnitario;
    private Double subtotal;
}
