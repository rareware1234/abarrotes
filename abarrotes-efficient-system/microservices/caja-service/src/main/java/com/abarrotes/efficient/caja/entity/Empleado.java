package com.abarrotes.efficient.caja.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "empleados")
public class Empleado {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String numeroEmpleado;

    @Column(nullable = false)
    private String password;

    // No-args constructor for JPA
    public Empleado() {}

    // Getters
    public Long getId() { return id; }
    public String getNumeroEmpleado() { return numeroEmpleado; }
    public String getPassword() { return password; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setNumeroEmpleado(String numeroEmpleado) { this.numeroEmpleado = numeroEmpleado; }
    public void setPassword(String password) { this.password = password; }
}