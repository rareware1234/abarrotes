package com.abarrotes.caja.repository;

import com.abarrotes.caja.entity.Caja;
import com.abarrotes.caja.entity.EstadoCaja;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CajaRepository extends JpaRepository<Caja, Long> {
    Optional<Caja> findByEstado(EstadoCaja estado);
    Optional<Caja> findByEmpleadoIdAndEstado(Long empleadoId, EstadoCaja estado);
}
