package com.abarrotes.efficient.employee.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "access_tokens")
public class AccessToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long employeeId;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private LocalDateTime expiration;

    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, USED, EXPIRED

    // Constructor vacío para JPA
    public AccessToken() {}

    // Constructor con parámetros
    public AccessToken(Long employeeId, String token, LocalDateTime expiration) {
        this.employeeId = employeeId;
        this.token = token;
        this.expiration = expiration;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public LocalDateTime getExpiration() { return expiration; }
    public void setExpiration(LocalDateTime expiration) { this.expiration = expiration; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}