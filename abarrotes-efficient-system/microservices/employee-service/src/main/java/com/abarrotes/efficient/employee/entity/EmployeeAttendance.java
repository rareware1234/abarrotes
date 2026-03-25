package com.abarrotes.efficient.employee.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "employee_attendance")
public class EmployeeAttendance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long employeeId;

    @Column(nullable = false)
    private String type; // CHECK_IN, CHECK_OUT

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "branch_id")
    private Long branchId;

    // Constructor vacío para JPA
    public EmployeeAttendance() {}

    // Constructor con parámetros
    public EmployeeAttendance(Long employeeId, String type, LocalDateTime timestamp, Long branchId) {
        this.employeeId = employeeId;
        this.type = type;
        this.timestamp = timestamp;
        this.branchId = branchId;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
}