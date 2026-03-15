package com.abarrotes.efficient.empleado.controller;

import com.abarrotes.efficient.empleado.entity.Empleado;
import com.abarrotes.efficient.empleado.service.EmpleadoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/empleados")
public class EmpleadoController {

    @Autowired
    private EmpleadoService empleadoService;

    @GetMapping
    public List<Empleado> getAllEmpleados() {
        return empleadoService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Empleado> getEmpleadoById(@PathVariable Long id) {
        return empleadoService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/numero/{numero}")
    public ResponseEntity<Empleado> getEmpleadoByNumero(@PathVariable String numero) {
        return empleadoService.findByNumeroEmpleado(numero)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Empleado createEmpleado(@RequestBody Empleado empleado) {
        return empleadoService.save(empleado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Empleado> updateEmpleado(@PathVariable Long id, @RequestBody Empleado empleadoDetails) {
        return empleadoService.findById(id)
                .map(empleado -> {
                    empleado.setNumeroEmpleado(empleadoDetails.getNumeroEmpleado());
                    empleado.setNombre(empleadoDetails.getNombre());
                    empleado.setApellido(empleadoDetails.getApellido());
                    empleado.setPuesto(empleadoDetails.getPuesto());
                    empleado.setActivo(empleadoDetails.getActivo());
                    return ResponseEntity.ok(empleadoService.save(empleado));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmpleado(@PathVariable Long id) {
        return empleadoService.findById(id)
                .map(empleado -> {
                    empleadoService.delete(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}