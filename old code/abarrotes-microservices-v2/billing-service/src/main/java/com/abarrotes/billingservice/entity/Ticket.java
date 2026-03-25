package com.abarrotes.billingservice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "tickets")
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderId; // ID de la orden original
    private String uuid; // UUID del CFDI (Timbre Fiscal Digital)
    private String rfcEmisor; // RFC de la empresa (Abarrotes Digitales)
    private String rfcReceptor; // RFC del cliente (Consumidor Final por defecto)
    private String regimenFiscal; // Régimen fiscal del emisor
    private String usoCfdi; // Uso del CFDI (G01 - Consumo en general)
    private String formaPago; // Forma de pago (01 - Efectivo, 03 - Tarjeta, etc.)
    private String metodoPago; // Método de pago (PUE - Pago en una sola exhibición)
    private String lugarExpedicion; // Código postal de expedición
    private Double subtotal;
    private Double totalImpuestos; // IVA
    private Double total;
    private String estado; // ACTIVO, CANCELADO
    private LocalDateTime fechaEmision;
    private LocalDateTime fechaTimbrado;
    
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "ticket_id")
    private List<TicketItem> items;

    @PrePersist
    void prePersist() {
        this.fechaEmision = LocalDateTime.now();
        this.estado = "ACTIVO";
        this.rfcEmisor = "AAD980314XXX"; // RFC de ejemplo
        this.regimenFiscal = "612"; // Persona Moral con Actividad Empresarial
        this.lugarExpedicion = "06000"; // CDMX
        this.usoCfdi = "G01";
        this.metodoPago = "PUE";
    }
}
