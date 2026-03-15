package com.abarrotes.efficient.empleado.service;

import com.abarrotes.efficient.empleado.entity.Empleado;
import com.abarrotes.efficient.empleado.repository.EmpleadoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class EmpleadoService {

    @Autowired
    private EmpleadoRepository empleadoRepository;

    public List<Empleado> findAll() {
        return empleadoRepository.findAll();
    }

    public Optional<Empleado> findById(Long id) {
        return empleadoRepository.findById(id);
    }

    public Optional<Empleado> findByNumeroEmpleado(String numeroEmpleado) {
        return empleadoRepository.findByNumeroEmpleado(numeroEmpleado);
    }

    public Empleado save(Empleado empleado) {
        if (empleado.getFechaRegistro() == null) {
            empleado.setFechaRegistro(LocalDateTime.now());
        }
        return empleadoRepository.save(empleado);
    }

    public void delete(Long id) {
        empleadoRepository.deleteById(id);
    }

    public Boolean existsByNumeroEmpleado(String numeroEmpleado) {
        return empleadoRepository.existsByNumeroEmpleado(numeroEmpleado);
    }
}