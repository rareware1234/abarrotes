package com.abarrotes.efficient.employee.service;

import com.abarrotes.efficient.employee.entity.EmployeeAttendance;
import com.abarrotes.efficient.employee.repository.EmployeeAttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AttendanceService {

    @Autowired
    private EmployeeAttendanceRepository attendanceRepository;

    public EmployeeAttendance checkIn(Long employeeId, Long branchId) {
        EmployeeAttendance attendance = new EmployeeAttendance(employeeId, "CHECK_IN", LocalDateTime.now(), branchId);
        return attendanceRepository.save(attendance);
    }

    public EmployeeAttendance checkOut(Long employeeId, Long branchId) {
        EmployeeAttendance attendance = new EmployeeAttendance(employeeId, "CHECK_OUT", LocalDateTime.now(), branchId);
        return attendanceRepository.save(attendance);
    }

    public List<EmployeeAttendance> getAttendanceHistory(Long employeeId) {
        return attendanceRepository.findByEmployeeIdOrderByTimestampDesc(employeeId);
    }
}