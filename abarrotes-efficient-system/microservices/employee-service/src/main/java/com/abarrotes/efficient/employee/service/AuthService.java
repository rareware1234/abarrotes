package com.abarrotes.efficient.employee.service;

import com.abarrotes.efficient.employee.entity.AccessToken;
import com.abarrotes.efficient.employee.repository.AccessTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private AccessTokenRepository accessTokenRepository;

    public String generateAccessToken(Long employeeId) {
        String token = UUID.randomUUID().toString();
        LocalDateTime expiration = LocalDateTime.now().plusMinutes(15); // Token valido por 15 minutos
        
        AccessToken accessToken = new AccessToken(employeeId, token, expiration);
        accessTokenRepository.save(accessToken);
        
        return token;
    }

    public boolean validateToken(String token) {
        Optional<AccessToken> tokenOpt = accessTokenRepository.findByTokenAndStatus(token, "ACTIVE");
        if (tokenOpt.isPresent()) {
            AccessToken accessToken = tokenOpt.get();
            if (accessToken.getExpiration().isAfter(LocalDateTime.now())) {
                return true;
            } else {
                accessToken.setStatus("EXPIRED");
                accessTokenRepository.save(accessToken);
            }
        }
        return false;
    }

    public void resetAccess(Long employeeId) {
        // Invalidar tokens activos
        // En una implementación real, aquí se enviaría un correo o notificación
        System.out.println("Reset de acceso para empleado: " + employeeId);
    }
}