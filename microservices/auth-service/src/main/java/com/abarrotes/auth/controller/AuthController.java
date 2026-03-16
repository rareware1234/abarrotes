package com.abarrotes.auth.controller;

import com.abarrotes.auth.entity.Employee;
import com.abarrotes.auth.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String employeeCode = request.get("employeeCode");
        String password = request.get("password");

        String token = authService.login(employeeCode, password);

        if (token != null) {
            Optional<Employee> employee = authService.findByCode(employeeCode);
            return ResponseEntity.ok(Map.of(
                "token", token,
                "employeeCode", employee.get().getEmployeeCode(),
                "fullName", employee.get().getFullName(),
                "role", employee.get().getRole()
            ));
        } else {
            return ResponseEntity.status(401).body(Map.of("error", "Credenciales inválidas"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Employee employee) {
        if (authService.findByCode(employee.getEmployeeCode()).isPresent()) {
            return ResponseEntity.status(400).body(Map.of("error", "El código de empleado ya existe"));
        }
        Employee saved = authService.save(employee);
        return ResponseEntity.ok(Map.of("message", "Empleado registrado exitosamente", "employeeCode", saved.getEmployeeCode()));
    }
}
