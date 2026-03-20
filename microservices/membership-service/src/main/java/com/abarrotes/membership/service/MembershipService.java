package com.abarrotes.membership.service;

import com.abarrotes.membership.entity.Membership;
import com.abarrotes.membership.entity.MembershipStatus;
import com.abarrotes.membership.entity.MembershipType;
import com.abarrotes.membership.repository.MembershipRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class MembershipService {

    private final MembershipRepository membershipRepository;

    public MembershipService(MembershipRepository membershipRepository) {
        this.membershipRepository = membershipRepository;
    }

    public Membership createMembership(Long userId, MembershipType type) {
        // Verificar si ya tiene membresía activa
        Optional<Membership> existing = membershipRepository.findByUserId(userId);
        if (existing.isPresent() && existing.get().getStatus() == MembershipStatus.ACTIVA) {
            throw new RuntimeException("El usuario ya tiene una membresía activa");
        }

        LocalDateTime startDate = LocalDateTime.now();
        LocalDateTime endDate = type == MembershipType.MENSUAL 
            ? startDate.plusMonths(1) 
            : startDate.plusYears(1);

        Membership membership = Membership.builder()
                .userId(userId)
                .membershipType(type)
                .status(MembershipStatus.ACTIVA)
                .startDate(startDate)
                .endDate(endDate)
                .build();

        return membershipRepository.save(membership);
    }

    public Optional<Membership> findByUserId(Long userId) {
        return membershipRepository.findByUserId(userId);
    }

    public boolean isMembershipActive(Long userId) {
        return membershipRepository.existsByUserIdAndStatus(userId, MembershipStatus.ACTIVA);
    }

    public Membership cancelMembership(Long membershipId) {
        Membership membership = membershipRepository.findById(membershipId)
                .orElseThrow(() -> new RuntimeException("Membresía no encontrada"));
        
        membership.setStatus(MembershipStatus.CANCELADA);
        return membershipRepository.save(membership);
    }

    public Membership renewMembership(Long membershipId) {
        Membership membership = membershipRepository.findById(membershipId)
                .orElseThrow(() -> new RuntimeException("Membresía no encontrada"));
        
        LocalDateTime newStartDate = LocalDateTime.now();
        LocalDateTime newEndDate = membership.getMembershipType() == MembershipType.MENSUAL 
            ? newStartDate.plusMonths(1) 
            : newStartDate.plusYears(1);

        membership.setStartDate(newStartDate);
        membership.setEndDate(newEndDate);
        membership.setStatus(MembershipStatus.ACTIVA);
        
        return membershipRepository.save(membership);
    }

    public List<Membership> findActiveMemberships() {
        return membershipRepository.findByStatus(MembershipStatus.ACTIVA);
    }

    public void checkAndExpireMemberships() {
        List<Membership> activeMemberships = findActiveMemberships();
        LocalDateTime now = LocalDateTime.now();
        
        for (Membership membership : activeMemberships) {
            if (membership.getEndDate().isBefore(now)) {
                membership.setStatus(MembershipStatus.EXPIRADA);
                membershipRepository.save(membership);
            }
        }
    }
}
