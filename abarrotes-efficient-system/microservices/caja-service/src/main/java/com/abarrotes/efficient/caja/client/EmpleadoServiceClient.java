package com.abarrotes.efficient.caja.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "empleado-service", url = "http://localhost:8085")
public interface EmpleadoServiceClient {
    
    @GetMapping("/api/empleados/numero/{numero}")
    EmpleadoResponse getEmpleadoByNumero(@PathVariable("numero") String numero);
}

class EmpleadoResponse {
    private Long id;
    private String numeroEmpleado;
    private String nombre;
    private String apellido;
    private String puesto;
    private Boolean activo;

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNumeroEmpleado() { return numeroEmpleado; }
    public void setNumeroEmpleado(String numeroEmpleado) { this.numeroEmpleado = numeroEmpleado; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }
    public String getPuesto() { return puesto; }
    public void setPuesto(String puesto) { this.puesto = puesto; }
    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}