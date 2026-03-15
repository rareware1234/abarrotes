package com.abarrotes.efficient.caja.service;

import com.abarrotes.efficient.caja.client.EmpleadoServiceClient;
import com.abarrotes.efficient.caja.client.EmpleadoResponse;
import com.abarrotes.efficient.caja.dto.AperturaCajaRequest;
import com.abarrotes.efficient.caja.entity.SesionCaja;
import com.abarrotes.efficient.caja.repository.SesionCajaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SesionCajaService {

    @Autowired
    private SesionCajaRepository sesionCajaRepository;

    @Autowired
    private EmpleadoServiceClient empleadoServiceClient;

    public SesionCaja abrirCaja(AperturaCajaRequest request) {
        // Validar que el empleado existe y está activo
        EmpleadoResponse empleado = empleadoServiceClient.getEmpleadoByNumero(request.getNumeroEmpleado());
        if (empleado == null || !empleado.getActivo()) {
            throw new RuntimeException("Empleado no encontrado o inactivo");
        }

        // Verificar que no tenga una caja abierta
        if (sesionCajaRepository.existsByNumeroEmpleadoAndEstado(request.getNumeroEmpleado(), SesionCaja.EstadoCaja.ABIERTA)) {
            throw new RuntimeException("El empleado ya tiene una caja abierta");
        }

        // Crear nueva sesión de caja
        SesionCaja sesion = new SesionCaja(request.getNumeroEmpleado(), request.getMontoApertura());
        return sesionCajaRepository.save(sesion);
    }

    public SesionCaja cerrarCaja(Long id, Double montoCierre) {
        Optional<SesionCaja> optionalSesion = sesionCajaRepository.findById(id);
        if (optionalSesion.isEmpty()) {
            throw new RuntimeException("Sesión de caja no encontrada");
        }

        SesionCaja sesion = optionalSesion.get();
        if (sesion.getEstado() != SesionCaja.EstadoCaja.ABIERTA) {
            throw new RuntimeException("La caja ya está cerrada");
        }

        // Calcular diferencia
        Double totalEsperado = sesion.getMontoApertura(); // En realidad aquí irían las ventas en efectivo
        Double diferencia = montoCierre - totalEsperado;

        sesion.setMontoCierre(montoCierre);
        sesion.setDiferencia(diferencia);
        sesion.setFechaCierre(LocalDateTime.now());
        sesion.setEstado(SesionCaja.EstadoCaja.CERRADA);

        return sesionCajaRepository.save(sesion);
    }

    public Optional<SesionCaja> getSesionAbierta(String numeroEmpleado) {
        return sesionCajaRepository.findByNumeroEmpleadoAndEstado(numeroEmpleado, SesionCaja.EstadoCaja.ABIERTA);
    }

    public List<SesionCaja> getSesionesEmpleado(String numeroEmpleado) {
        return sesionCajaRepository.findByNumeroEmpleado(numeroEmpleado);
    }

    public List<SesionCaja> getSesionesPorFecha(LocalDateTime start, LocalDateTime end) {
        return sesionCajaRepository.findByFechaAperturaBetween(start, end);
    }
}