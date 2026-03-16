package com.abarrotes.membership.repository;

import com.abarrotes.membership.entity.Membership;
import com.abarrotes.membership.entity.MembershipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MembershipRepository extends JpaRepository<Membership, Long> {
    Optional<Membership> findByUserId(Long userId);
    List<Membership> findByStatus(MembershipStatus status);
    boolean existsByUserIdAndStatus(Long userId, MembershipStatus status);
}
