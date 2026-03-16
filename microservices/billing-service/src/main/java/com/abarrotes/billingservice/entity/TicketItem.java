package com.abarrotes.billingservice.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "ticket_items")
public class TicketItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String claveProdServ; // Clave producto/servicio SAT
    private String descripcion;
    private Integer cantidad;
    private String unidad; // Unidad de medida (Pieza, KG, etc.)
    private Double precioUnitario;
    private Double importe;
    private Double baseImpuesto; // Base para el cálculo del impuesto
    private Double tasaImpuesto; // Tasa del impuesto (16% para IVA)
    private Double importeImpuesto; // Importe del impuesto
}
