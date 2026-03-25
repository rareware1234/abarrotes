package com.abarrotes.efficient.caja.controller;

import com.abarrotes.efficient.caja.dto.AperturaCajaRequest;
import com.abarrotes.efficient.caja.entity.SesionCaja;
import com.abarrotes.efficient.caja.service.SesionCajaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/caja")
public class SesionCajaController {

    @Autowired
    private SesionCajaService sesionCajaService;

    // Abrir caja
    @PostMapping("/abrir")
    public ResponseEntity<?> abrirCaja(@RequestBody AperturaCajaRequest request) {
        try {
            SesionCaja sesion = sesionCajaService.abrirCaja(request);
            return ResponseEntity.ok(sesion);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Cerrar caja
    @PostMapping("/cerrar/{id}")
    public ResponseEntity<?> cerrarCaja(@PathVariable Long id, @RequestParam Double montoCierre) {
        try {
            SesionCaja sesion = sesionCajaService.cerrarCaja(id, montoCierre);
            return ResponseEntity.ok(sesion);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Verificar caja abierta para un empleado
    @GetMapping("/abierta/{numeroEmpleado}")
    public ResponseEntity<SesionCaja> getCajaAbierta(@PathVariable String numeroEmpleado) {
        return sesionCajaService.getSesionAbierta(numeroEmpleado)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Obtener historial de sesiones de un empleado
    @GetMapping("/historial/{numeroEmpleado}")
    public List<SesionCaja> getHistorial(@PathVariable String numeroEmpleado) {
        return sesionCajaService.getSesionesEmpleado(numeroEmpleado);
    }

    // Obtener sesiones por rango de fechas
    @GetMapping("/fecha")
    public List<SesionCaja> getSesionesPorFecha(
            @RequestParam String start,
            @RequestParam String end) {
        return sesionCajaService.getSesionesPorFecha(
                LocalDateTime.parse(start),
                LocalDateTime.parse(end)
        );
    }

    // Login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String numeroEmpleado = request.get("numeroEmpleado");
        String password = request.get("password");
        
        // TODO: Implementar autenticación real
        if ("ADMIN001".equals(numeroEmpleado) && "admin123".equals(password)) {
            return ResponseEntity.ok(Map.of("message", "Login successful", "numeroEmpleado", numeroEmpleado));
        } else {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }
    }
}