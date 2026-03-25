package com.abarrotes.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Pedido {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    private Usuario usuario;
    private LocalDateTime fechaPedido;
    private Double montoTotal;
    @Enumerated(EnumType.STRING)
    private Estado estado;
    @Enumerated(EnumType.STRING)
    private Tipo tipo;
    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PedidoItem> items = new ArrayList<>();

    public enum Estado { PENDIENTE, PAGADO, ENVIADO, ENTREGADO, CANCELADO }
    public enum Tipo { UNICO, RECURRENTE }

    @PrePersist
    void pre() {
        if (fechaPedido == null) fechaPedido = LocalDateTime.now();
        if (estado == null) estado = Estado.PENDIENTE;
        if (tipo == null) tipo = Tipo.UNICO;
    }
}
