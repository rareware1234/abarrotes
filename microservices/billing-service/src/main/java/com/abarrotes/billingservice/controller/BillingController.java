package com.abarrotes.billingservice.controller;

import com.abarrotes.billingservice.entity.Ticket;
import com.abarrotes.billingservice.service.BillingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/billing")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @GetMapping("/hello")
    public ResponseEntity<String> hello() {
        return ResponseEntity.ok("Billing Service is running!");
    }

    @PostMapping("/ticket")
    public ResponseEntity<?> generateTicket(@RequestBody CreateTicketRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "No hay items en la solicitud"));
        }

        try {
            Ticket ticket = billingService.generateTicket(
                    request.getOrderId(),
                    request.getItems(),
                    request.getFormaPago()
            );

            return ResponseEntity.created(URI.create("/api/billing/ticket/" + ticket.getId()))
                    .body(Map.of(
                            "message", "Ticket generado exitosamente",
                            "uuid", ticket.getUuid(),
                            "total", ticket.getTotal(),
                            "fechaEmision", ticket.getFechaEmision(),
                            "fechaTimbrado", ticket.getFechaTimbrado()
                    ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Error al generar ticket: " + e.getMessage()));
        }
    }

    // Dependencia directa al repositorio para evitar dependencia circular
    @GetMapping("/ticket/{id}")
    public ResponseEntity<?> getTicket(@PathVariable Long id) {
        // En una implementación real, esto estaría en el servicio
        // Por ahora, devolvemos un mensaje simple
        return ResponseEntity.ok(Map.of("message", "Endpoint de consulta de ticket implementado"));
    }

    @GetMapping("/ticket/uuid/{uuid}")
    public ResponseEntity<?> getTicketByUuid(@PathVariable String uuid) {
        // En una implementación real, buscaríamos en la base de datos
        // Por ahora, devolvemos un mensaje simple
        return ResponseEntity.ok(Map.of("message", "Endpoint de consulta por UUID implementado"));
    }

    // DTOs (clase estática en lugar de record para Java 11)
    public static class CreateTicketRequest {
        private Long orderId;
        private List<BillingService.OrderItemDTO> items;
        private String formaPago;

        public CreateTicketRequest() {}

        public CreateTicketRequest(Long orderId, List<BillingService.OrderItemDTO> items, String formaPago) {
            this.orderId = orderId;
            this.items = items;
            this.formaPago = formaPago;
        }

        public Long getOrderId() { return orderId; }
        public void setOrderId(Long orderId) { this.orderId = orderId; }
        public List<BillingService.OrderItemDTO> getItems() { return items; }
        public void setItems(List<BillingService.OrderItemDTO> items) { this.items = items; }
        public String getFormaPago() { return formaPago; }
        public void setFormaPago(String formaPago) { this.formaPago = formaPago; }
    }
}
