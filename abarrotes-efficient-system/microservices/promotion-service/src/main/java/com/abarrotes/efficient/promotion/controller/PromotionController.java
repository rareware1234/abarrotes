package com.abarrotes.efficient.promotion.controller;

import com.abarrotes.efficient.promotion.entity.Promocion;
import com.abarrotes.efficient.promotion.service.PromotionEngineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/promotions")
public class PromotionController {

    @Autowired
    private PromotionEngineService promotionEngineService;

    // Endpoint para ejecutar el motor de reglas manualmente
    @PostMapping("/generate")
    public ResponseEntity<List<Promocion>> generarPromociones() {
        List<Promocion> promociones = promotionEngineService.generarPromociones();
        return ResponseEntity.ok(promociones);
    }

    // Endpoint para obtener promociones activas
    @GetMapping
    public ResponseEntity<List<Promocion>> getPromocionesActivas() {
        List<Promocion> promociones = promotionEngineService.getActivePromotions();
        return ResponseEntity.ok(promociones);
    }
}