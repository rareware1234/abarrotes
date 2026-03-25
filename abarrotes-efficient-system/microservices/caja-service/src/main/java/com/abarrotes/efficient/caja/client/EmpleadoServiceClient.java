package com.abarrotes.efficient.caja.client;

import com.abarrotes.efficient.caja.dto.EmpleadoResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "empleado-service", url = "http://localhost:8085")
public interface EmpleadoServiceClient {
    
    @GetMapping("/api/empleados/numero/{numero}")
    EmpleadoResponse getEmpleadoByNumero(@PathVariable("numero") String numero);
}