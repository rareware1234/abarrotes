package com.abarrotes.membership.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "memberships")
public class Membership {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MembershipType membershipType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MembershipStatus status;

    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Membership() {}

    public Membership(Long id, Long userId, MembershipType membershipType, MembershipStatus status, 
                     LocalDateTime startDate, LocalDateTime endDate, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.membershipType = membershipType;
        this.status = status;
        this.startDate = startDate;
        this.endDate = endDate;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters
    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public MembershipType getMembershipType() { return membershipType; }
    public MembershipStatus getStatus() { return status; }
    public LocalDateTime getStartDate() { return startDate; }
    public LocalDateTime getEndDate() { return endDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setMembershipType(MembershipType membershipType) { this.membershipType = membershipType; }
    public void setStatus(MembershipStatus status) { this.status = status; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Builder pattern manual
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private Long id;
        private Long userId;
        private MembershipType membershipType;
        private MembershipStatus status;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        
        public Builder id(Long id) { this.id = id; return this; }
        public Builder userId(Long userId) { this.userId = userId; return this; }
        public Builder membershipType(MembershipType membershipType) { this.membershipType = membershipType; return this; }
        public Builder status(MembershipStatus status) { this.status = status; return this; }
        public Builder startDate(LocalDateTime startDate) { this.startDate = startDate; return this; }
        public Builder endDate(LocalDateTime endDate) { this.endDate = endDate; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        
        public Membership build() {
            return new Membership(id, userId, membershipType, status, startDate, endDate, createdAt, updatedAt);
        }
    }
}
