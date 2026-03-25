package com.abarrotes.efficient.employee.service;

import com.abarrotes.efficient.employee.util.QRCodeGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class QRCodeService {

    @Autowired
    private QRCodeGenerator qrCodeGenerator;

    public Map<String, String> generateAttendanceQR(Long employeeId, String type) throws Exception {
        // Generar payload JSON simple
        String payload = String.format("{\"employeeId\":%d,\"type\":\"%s\",\"timestamp\":\"%s\"}",
                employeeId, type, LocalDateTime.now().toString());

        String base64QR = qrCodeGenerator.generateQRCodeImage(payload, 200, 200);
        
        Map<String, String> response = new HashMap<>();
        response.put("qrCode", base64QR);
        response.put("payload", payload);
        return response;
    }
}