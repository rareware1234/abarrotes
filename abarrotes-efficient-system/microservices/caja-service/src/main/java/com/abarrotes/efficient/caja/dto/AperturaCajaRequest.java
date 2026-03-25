package com.abarrotes.efficient.caja.dto;

public class AperturaCajaRequest {
    private String numeroEmpleado;
    private Double montoApertura;

    public AperturaCajaRequest() {}

    public String getNumeroEmpleado() { return numeroEmpleado; }
    public void setNumeroEmpleado(String numeroEmpleado) { this.numeroEmpleado = numeroEmpleado; }
    public Double getMontoApertura() { return montoApertura; }
    public void setMontoApertura(Double montoApertura) { this.montoApertura = montoApertura; }
}