package com.abarrotes.efficient.employee.controller;

import com.abarrotes.efficient.employee.service.QRCodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/qr")
public class QRCodeController {

    @Autowired
    private QRCodeService qrCodeService;

    @GetMapping("/generate")
    public ResponseEntity<Map<String, String>> generateQR(
            @RequestParam Long employeeId,
            @RequestParam(defaultValue = "ATTENDANCE") String type) {
        try {
            return ResponseEntity.ok(qrCodeService.generateAttendanceQR(employeeId, type));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}