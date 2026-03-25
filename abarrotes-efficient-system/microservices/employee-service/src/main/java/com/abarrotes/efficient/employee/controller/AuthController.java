package com.abarrotes.efficient.employee.controller;

import com.abarrotes.efficient.employee.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/generate-access-token")
    public ResponseEntity<Map<String, String>> generateToken(@RequestParam Long employeeId) {
        String token = authService.generateAccessToken(employeeId);
        return ResponseEntity.ok(Map.of("accessToken", token, "expiresIn", "15 minutes"));
    }

    @PostMapping("/validate-access-token")
    public ResponseEntity<Map<String, String>> validateToken(@RequestParam String token) {
        boolean isValid = authService.validateToken(token);
        if (isValid) {
            return ResponseEntity.ok(Map.of("status", "valid"));
        } else {
            return ResponseEntity.status(401).body(Map.of("status", "invalid or expired"));
        }
    }

    @PostMapping("/reset-access")
    public ResponseEntity<String> resetAccess(@RequestParam Long employeeId) {
        authService.resetAccess(employeeId);
        return ResponseEntity.ok("Access reset initiated");
    }
}