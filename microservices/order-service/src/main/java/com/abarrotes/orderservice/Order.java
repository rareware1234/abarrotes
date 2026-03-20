package com.abarrotes.orderservice;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name="orders_tbl")
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private Double total;
    private Boolean freeShipping;
    @Enumerated(EnumType.STRING) private Status status;
    private LocalDateTime createdAt;
    public enum Status { PENDIENTE, PAGADO, ENVIADO, ENTREGADO, CANCELADO }
    @PrePersist void pre(){ if (createdAt==null) createdAt = LocalDateTime.now(); if (status==null) status=Status.PENDIENTE; if (freeShipping==null) freeShipping=false;}
}
