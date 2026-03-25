package com.abarrotes.efficient.employee.controller;

import com.abarrotes.efficient.employee.entity.EmployeeAttendance;
import com.abarrotes.efficient.employee.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @PostMapping("/check-in")
    public ResponseEntity<EmployeeAttendance> checkIn(@RequestParam Long employeeId, @RequestParam Long branchId) {
        return ResponseEntity.ok(attendanceService.checkIn(employeeId, branchId));
    }

    @PostMapping("/check-out")
    public ResponseEntity<EmployeeAttendance> checkOut(@RequestParam Long employeeId, @RequestParam Long branchId) {
        return ResponseEntity.ok(attendanceService.checkOut(employeeId, branchId));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<EmployeeAttendance>> getAttendance(@PathVariable Long employeeId) {
        return ResponseEntity.ok(attendanceService.getAttendanceHistory(employeeId));
    }
}