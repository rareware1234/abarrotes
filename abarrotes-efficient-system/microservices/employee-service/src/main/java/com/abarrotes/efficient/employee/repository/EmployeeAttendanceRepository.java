package com.abarrotes.efficient.employee.repository;

import com.abarrotes.efficient.employee.entity.EmployeeAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeAttendanceRepository extends JpaRepository<EmployeeAttendance, Long> {
    List<EmployeeAttendance> findByEmployeeIdOrderByTimestampDesc(Long employeeId);
}