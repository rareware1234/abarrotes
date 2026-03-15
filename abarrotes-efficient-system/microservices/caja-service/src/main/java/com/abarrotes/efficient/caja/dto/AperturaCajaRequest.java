package com.abarrotes.efficient.caja.dto;

import lombok.Data;

@Data
public class AperturaCajaRequest {
    private String numeroEmpleado;
    private Double montoApertura;
}