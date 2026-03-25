package com.abarrotes.efficient.empleado.entity;

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
    private String nombre;

    @Column(nullable = false)
    private String apellido;

    @Column(nullable = false)
    private String puesto;

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(name = "fecha_registro")
    private java.time.LocalDateTime fechaRegistro;

    @Column(nullable = false)
    private String password;
    
    // Constructor para creación rápida
    public Empleado(String numeroEmpleado, String nombre, String apellido, String puesto, String password) {
        this.numeroEmpleado = numeroEmpleado;
        this.nombre = nombre;
        this.apellido = apellido;
        this.puesto = puesto;
        this.activo = true;
        this.fechaRegistro = java.time.LocalDateTime.now();
        this.password = password;
    }
    
    // No-args constructor for JPA
    public Empleado() {}

    // Getters
    public Long getId() { return id; }
    public String getNumeroEmpleado() { return numeroEmpleado; }
    public String getNombre() { return nombre; }
    public String getApellido() { return apellido; }
    public String getPuesto() { return puesto; }
    public Boolean getActivo() { return activo; }
    public java.time.LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public String getPassword() { return password; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setNumeroEmpleado(String numeroEmpleado) { this.numeroEmpleado = numeroEmpleado; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public void setApellido(String apellido) { this.apellido = apellido; }
    public void setPuesto(String puesto) { this.puesto = puesto; }
    public void setActivo(Boolean activo) { this.activo = activo; }
    public void setFechaRegistro(java.time.LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }
    public void setPassword(String password) { this.password = password; }
}