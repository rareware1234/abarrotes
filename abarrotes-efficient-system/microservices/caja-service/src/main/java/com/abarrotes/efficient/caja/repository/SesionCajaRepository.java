package com.abarrotes.efficient.caja.repository;

import com.abarrotes.efficient.caja.entity.SesionCaja;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SesionCajaRepository extends JpaRepository<SesionCaja, Long> {
    
    // Buscar caja abierta por número de empleado
    Optional<SesionCaja> findByNumeroEmpleadoAndEstado(String numeroEmpleado, SesionCaja.EstadoCaja estado);
    
    // Buscar todas las sesiones de un empleado
    List<SesionCaja> findByNumeroEmpleado(String numeroEmpleado);
    
    // Buscar sesiones por fecha
    List<SesionCaja> findByFechaAperturaBetween(LocalDateTime start, LocalDateTime end);
    
    // Verificar si existe una caja abierta para un empleado
    Boolean existsByNumeroEmpleadoAndEstado(String numeroEmpleado, SesionCaja.EstadoCaja estado);
}