package com.abarrotes.membership.controller;

import com.abarrotes.membership.entity.Membership;
import com.abarrotes.membership.entity.MembershipType;
import com.abarrotes.membership.service.MembershipService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/memberships")
public class MembershipController {

    private final MembershipService membershipService;

    public MembershipController(MembershipService membershipService) {
        this.membershipService = membershipService;
    }

    @PostMapping
    public ResponseEntity<Membership> createMembership(@RequestParam Long userId, @RequestParam MembershipType type) {
        try {
            Membership membership = membershipService.createMembership(userId, type);
            return ResponseEntity.ok(membership);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Membership> getMembershipByUser(@PathVariable Long userId) {
        Optional<Membership> membership = membershipService.findByUserId(userId);
        return membership.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}/active")
    public ResponseEntity<Map<String, Object>> checkActiveMembership(@PathVariable Long userId) {
        boolean isActive = membershipService.isMembershipActive(userId);
        Optional<Membership> membership = membershipService.findByUserId(userId);
        
        if (isActive && membership.isPresent()) {
            return ResponseEntity.ok(Map.of(
                "active", true,
                "membershipType", membership.get().getMembershipType().name(),
                "expiresAt", membership.get().getEndDate().toString()
            ));
        }
        
        return ResponseEntity.ok(Map.of("active", false));
    }

    @PutMapping("/{membershipId}/cancel")
    public ResponseEntity<Membership> cancelMembership(@PathVariable Long membershipId) {
        try {
            Membership membership = membershipService.cancelMembership(membershipId);
            return ResponseEntity.ok(membership);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{membershipId}/renew")
    public ResponseEntity<Membership> renewMembership(@PathVariable Long membershipId) {
        try {
            Membership membership = membershipService.renewMembership(membershipId);
            return ResponseEntity.ok(membership);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/active")
    public ResponseEntity<List<Membership>> getActiveMemberships() {
        List<Membership> activeMemberships = membershipService.findActiveMemberships();
        return ResponseEntity.ok(activeMemberships);
    }
}
