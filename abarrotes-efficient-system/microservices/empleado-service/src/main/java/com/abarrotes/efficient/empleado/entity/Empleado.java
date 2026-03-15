package com.abarrotes.efficient.empleado.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "empleados")
@Data
@NoArgsConstructor
@AllArgsConstructor
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
    
    // Constructor para creación rápida
    public Empleado(String numeroEmpleado, String nombre, String apellido, String puesto) {
        this.numeroEmpleado = numeroEmpleado;
        this.nombre = nombre;
        this.apellido = apellido;
        this.puesto = puesto;
        this.activo = true;
        this.fechaRegistro = java.time.LocalDateTime.now();
    }
}