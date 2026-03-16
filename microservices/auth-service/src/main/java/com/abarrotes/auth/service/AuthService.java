package com.abarrotes.auth.service;

import com.abarrotes.auth.entity.Employee;
import com.abarrotes.auth.repository.EmployeeRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Optional;

@Service
public class AuthService {

    private final EmployeeRepository employeeRepository;
    
    // Clave secreta para JWT (en producción debe estar en application.properties)
    private final SecretKey key = Keys.secretKeyFor(SignatureAlgorithm.HS256);

    public AuthService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    public String login(String employeeCode, String password) {
        Optional<Employee> employeeOpt = employeeRepository.findByEmployeeCode(employeeCode);
        
        if (employeeOpt.isPresent() && employeeOpt.get().getPassword().equals(password)) {
            // Generar JWT
            return Jwts.builder()
                    .setSubject(employeeCode)
                    .claim("role", employeeOpt.get().getRole())
                    .claim("fullName", employeeOpt.get().getFullName())
                    .setIssuedAt(new Date())
                    .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 8)) // 8 horas
                    .signWith(key)
                    .compact();
        }
        return null;
    }

    public Optional<Employee> findByCode(String employeeCode) {
        return employeeRepository.findByEmployeeCode(employeeCode);
    }
    
    public Employee save(Employee employee) {
        return employeeRepository.save(employee);
    }
}
