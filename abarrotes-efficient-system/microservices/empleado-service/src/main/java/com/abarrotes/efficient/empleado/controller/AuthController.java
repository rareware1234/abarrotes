package com.abarrotes.efficient.empleado.controller;

import com.abarrotes.efficient.empleado.entity.Empleado;
import com.abarrotes.efficient.empleado.service.EmpleadoService;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private EmpleadoService empleadoService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String numeroEmpleado = request.get("numeroEmpleado");
        String password = request.get("password");
        
        return empleadoService.findByNumeroEmpleado(numeroEmpleado)
                .map(empleado -> {
                    if (BCrypt.checkpw(password, empleado.getPassword())) {
                        return ResponseEntity.ok(Map.of("message", "Login successful", "numeroEmpleado", numeroEmpleado));
                    } else {
                        return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
                    }
                })
                .orElse(ResponseEntity.status(401).body(Map.of("error", "Employee not found")));
    }
}