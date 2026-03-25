package com.abarrotes.efficient.employee.repository;

import com.abarrotes.efficient.employee.entity.AccessToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccessTokenRepository extends JpaRepository<AccessToken, Long> {
    Optional<AccessToken> findByTokenAndStatus(String token, String status);
}