package com.abarrotes.efficient.caja.repository;

import com.abarrotes.efficient.caja.entity.Empleado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmpleadoRepository extends JpaRepository<Empleado, Long> {
    Optional<Empleado> findByNumeroEmpleado(String numeroEmpleado);
}