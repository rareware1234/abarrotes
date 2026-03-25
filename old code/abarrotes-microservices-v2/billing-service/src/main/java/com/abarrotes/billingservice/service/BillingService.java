package com.abarrotes.billingservice.service;

import com.abarrotes.billingservice.entity.Ticket;
import com.abarrotes.billingservice.entity.TicketItem;
import com.abarrotes.billingservice.repository.TicketRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class BillingService {

    private final TicketRepository ticketRepository;

    public BillingService(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    public Ticket generateTicket(Long orderId, List<OrderItemDTO> items, String formaPago) {
        // Calcular totales
        double subtotal = 0.0;
        double totalImpuestos = 0.0;
        
        List<TicketItem> ticketItems = new ArrayList<>();
        
        for (OrderItemDTO item : items) {
            double itemSubtotal = item.getPrecio() * item.getCantidad();
            double itemImpuesto = itemSubtotal * 0.16; // 16% IVA
            double itemTotal = itemSubtotal + itemImpuesto;
            
            subtotal += itemSubtotal;
            totalImpuestos += itemImpuesto;
            
            TicketItem ticketItem = TicketItem.builder()
                    .claveProdServ("01010101") // Clave genérica para bienes
                    .descripcion(item.getDescripcion())
                    .cantidad(item.getCantidad())
                    .unidad("Pieza")
                    .precioUnitario(item.getPrecio())
                    .importe(itemSubtotal)
                    .baseImpuesto(itemSubtotal)
                    .tasaImpuesto(0.16)
                    .importeImpuesto(itemImpuesto)
                    .build();
            
            ticketItems.add(ticketItem);
        }
        
        double total = subtotal + totalImpuestos;
        
        // Generar UUID simulado (en producción esto vendría del PAC)
        String uuid = UUID.randomUUID().toString();
        
        Ticket ticket = Ticket.builder()
                .orderId(orderId)
                .uuid(uuid)
                .formaPago(formaPago)
                .subtotal(subtotal)
                .totalImpuestos(totalImpuestos)
                .total(total)
                .fechaTimbrado(LocalDateTime.now())
                .items(ticketItems)
                .build();
                
        return ticketRepository.save(ticket);
    }
    
    // DTO para recibir datos del pedido (clase estática en lugar de record para Java 11)
    public static class OrderItemDTO {
        private Long productId;
        private String descripcion;
        private Integer cantidad;
        private Double precio;

        public OrderItemDTO() {}
        
        public OrderItemDTO(Long productId, String descripcion, Integer cantidad, Double precio) {
            this.productId = productId;
            this.descripcion = descripcion;
            this.cantidad = cantidad;
            this.precio = precio;
        }

        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }
        public String getDescripcion() { return descripcion; }
        public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
        public Integer getCantidad() { return cantidad; }
        public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
        public Double getPrecio() { return precio; }
        public void setPrecio(Double precio) { this.precio = precio; }
    }
}
