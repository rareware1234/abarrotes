package com.abarrotes.caja.service;

import com.abarrotes.caja.entity.Caja;
import com.abarrotes.caja.entity.EstadoCaja;
import com.abarrotes.caja.repository.CajaRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class CajaService {

    private final CajaRepository cajaRepository;

    public CajaService(CajaRepository cajaRepository) {
        this.cajaRepository = cajaRepository;
    }

    public Caja abrirCaja(Long empleadoId, String empleadoNombre, BigDecimal montoInicial) {
        // Verificar si ya hay una caja abierta para este empleado
        Optional<Caja> cajaAbierta = cajaRepository.findByEmpleadoIdAndEstado(empleadoId, EstadoCaja.ABIERTA);
        if (cajaAbierta.isPresent()) {
            throw new RuntimeException("El empleado ya tiene una caja abierta");
        }

        Caja caja = new Caja();
        caja.setNombre("Caja Principal");
        caja.setEstado(EstadoCaja.ABIERTA);
        caja.setMontoInicial(montoInicial);
        caja.setMontoFinal(BigDecimal.ZERO);
        caja.setTotalVentas(BigDecimal.ZERO);
        caja.setEmpleadoId(empleadoId);
        caja.setEmpleadoNombre(empleadoNombre);
        caja.setApertura(LocalDateTime.now());

        return cajaRepository.save(caja);
    }

    public Caja cerrarCaja(Long cajaId) {
        Optional<Caja> cajaOpt = cajaRepository.findById(cajaId);
        if (cajaOpt.isEmpty()) {
            throw new RuntimeException("Caja no encontrada");
        }

        Caja caja = cajaOpt.get();
        if (caja.getEstado() != EstadoCaja.ABIERTA) {
            throw new RuntimeException("La caja ya está cerrada");
        }

        caja.setEstado(EstadoCaja.CERRADA);
        caja.setCierre(LocalDateTime.now());
        // Calcular monto final (inicial + ventas)
        caja.setMontoFinal(caja.getMontoInicial().add(caja.getTotalVentas()));

        return cajaRepository.save(caja);
    }

    public Optional<Caja> obtenerCajaAbierta(Long empleadoId) {
        return cajaRepository.findByEmpleadoIdAndEstado(empleadoId, EstadoCaja.ABIERTA);
    }

    public Optional<Caja> obtenerCajaActual() {
        return cajaRepository.findByEstado(EstadoCaja.ABIERTA);
    }
}
