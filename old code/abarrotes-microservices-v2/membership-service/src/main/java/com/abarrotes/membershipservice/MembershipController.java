package com.abarrotes.membershipservice;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/memberships")
public class MembershipController {
    private final MembershipRepo repo;
    public MembershipController(MembershipRepo repo){ this.repo=repo; }

    record Create(Long userId, Membership.Type type){}
    @PostMapping public ResponseEntity<?> create(@RequestBody Create dto){
        var start = LocalDate.now();
        var end = dto.type()== Membership.Type.MENSUAL ? start.plusMonths(1) : start.plusYears(1);
        var m = Membership.builder().userId(dto.userId()).type(dto.type()).startDate(start).endDate(end).status(Membership.Status.ACTIVA).build();
        m = repo.save(m);
        return ResponseEntity.created(URI.create("/api/memberships/"+m.getId())).body(m);
    }
    @GetMapping public List<Membership> list(){ return repo.findAll(); }

    @GetMapping("/user/{userId}/active")
    public Map<String,Object> active(@PathVariable Long userId){
        boolean active = repo.findFirstByUserIdAndStatus(userId, Membership.Status.ACTIVA).map(Membership::isActive).orElse(false);
        return Map.of("userId", userId, "active", active);
    }
}
