package com.abarrotes.efficient.caja.service;

import com.abarrotes.efficient.caja.entity.Empleado;
import com.abarrotes.efficient.caja.repository.EmpleadoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private EmpleadoRepository empleadoRepository;

    public boolean authenticate(String numeroEmpleado, String password) {
        Optional<Empleado> empleadoOpt = empleadoRepository.findByNumeroEmpleado(numeroEmpleado);
        if (empleadoOpt.isPresent()) {
            // Plain text comparison (not secure, for testing only)
            return password.equals(empleadoOpt.get().getPassword());
        }
        return false;
    }
}