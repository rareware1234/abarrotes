package com.abarrotes.caja.controller;

import com.abarrotes.caja.entity.Caja;
import com.abarrotes.caja.service.CajaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/caja")
public class CajaController {

    private final CajaService cajaService;

    public CajaController(CajaService cajaService) {
        this.cajaService = cajaService;
    }

    @PostMapping("/abrir")
    public ResponseEntity<?> abrirCaja(@RequestBody Map<String, Object> request) {
        try {
            Long empleadoId = Long.valueOf(request.get("empleadoId").toString());
            String empleadoNombre = (String) request.get("empleadoNombre");
            BigDecimal montoInicial = new BigDecimal(request.get("montoInicial").toString());

            Caja caja = cajaService.abrirCaja(empleadoId, empleadoNombre, montoInicial);
            return ResponseEntity.ok(Map.of(
                "message", "Caja abierta exitosamente",
                "cajaId", caja.getId(),
                "apertura", caja.getApertura()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/cerrar/{cajaId}")
    public ResponseEntity<?> cerrarCaja(@PathVariable Long cajaId) {
        try {
            Caja caja = cajaService.cerrarCaja(cajaId);
            return ResponseEntity.ok(Map.of(
                "message", "Caja cerrada exitosamente",
                "montoFinal", caja.getMontoFinal(),
                "totalVentas", caja.getTotalVentas(),
                "cierre", caja.getCierre()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/estado/empleado/{empleadoId}")
    public ResponseEntity<?> obtenerEstadoCaja(@PathVariable Long empleadoId) {
        Optional<Caja> cajaOpt = cajaService.obtenerCajaAbierta(empleadoId);
        if (cajaOpt.isPresent()) {
            Caja caja = cajaOpt.get();
            return ResponseEntity.ok(Map.of(
                "abierta", true,
                "cajaId", caja.getId(),
                "montoInicial", caja.getMontoInicial(),
                "totalVentas", caja.getTotalVentas(),
                "apertura", caja.getApertura()
            ));
        } else {
            return ResponseEntity.ok(Map.of("abierta", false));
        }
    }

    @GetMapping("/estado")
    public ResponseEntity<?> obtenerEstadoCajaGlobal() {
        Optional<Caja> cajaOpt = cajaService.obtenerCajaActual();
        if (cajaOpt.isPresent()) {
            Caja caja = cajaOpt.get();
            return ResponseEntity.ok(Map.of(
                "abierta", true,
                "cajaId", caja.getId(),
                "empleado", caja.getEmpleadoNombre(),
                "montoInicial", caja.getMontoInicial(),
                "totalVentas", caja.getTotalVentas()
            ));
        } else {
            return ResponseEntity.ok(Map.of("abierta", false));
        }
    }
}
