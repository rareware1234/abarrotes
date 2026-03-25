package com.abarrotes.efficient.employee.controller;

import com.abarrotes.efficient.employee.entity.Employee;
import com.abarrotes.efficient.employee.service.AttendanceService;
import com.abarrotes.efficient.employee.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private AttendanceService attendanceService;

    @GetMapping("/{id}")
    public ResponseEntity<Employee> getEmployee(@PathVariable Long id) {
        Optional<Employee> employee = employeeService.getEmployeeById(id);
        return employee.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<Map<String, Object>> getProfile(@PathVariable Long id) {
        Optional<Employee> employeeOpt = employeeService.getEmployeeById(id);
        if (employeeOpt.isPresent()) {
            Employee employee = employeeOpt.get();
            return ResponseEntity.ok(Map.of(
                "id", employee.getId(),
                "name", employee.getName(),
                "role", employee.getRole(),
                "position", employee.getPosition(),
                "branchId", employee.getBranchId(),
                "status", employee.getStatus()
            ));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/attendance")
    public ResponseEntity<?> getAttendance(@PathVariable Long id) {
        return ResponseEntity.ok(attendanceService.getAttendanceHistory(id));
    }
}