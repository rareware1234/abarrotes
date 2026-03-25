package com.abarrotes.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Pago {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    private Usuario usuario;
    @ManyToOne
    private Membresia membresia; // opcional
    @ManyToOne
    private Pedido pedido; // opcional
    private LocalDateTime fechaPago;
    private Double monto;
    @Enumerated(EnumType.STRING)
    private Metodo metodo;
    private String referencia;
    @Enumerated(EnumType.STRING)
    private Estado estado;

    public enum Metodo { TARJETA, MERCADOPAGO, CODI, EFECTIVO }
    public enum Estado { EXITOSO, FALLIDO, PENDIENTE }

    @PrePersist
    void pre() {
        if (fechaPago == null) fechaPago = LocalDateTime.now();
        if (estado == null) estado = Estado.PENDIENTE;
    }
}
