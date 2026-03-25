package com.abarrotes.efficient.caja.controller;

import com.abarrotes.efficient.caja.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String numeroEmpleado = request.get("numeroEmpleado");
        String password = request.get("password");
        
        if (authService.authenticate(numeroEmpleado, password)) {
            return ResponseEntity.ok(Map.of("message", "Login successful", "numeroEmpleado", numeroEmpleado));
        } else {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }
    }
}