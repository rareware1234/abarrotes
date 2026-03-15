package com.abarrotes.membershipservice;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Membership {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    @Enumerated(EnumType.STRING) private Type type;
    private LocalDate startDate;
    private LocalDate endDate;
    @Enumerated(EnumType.STRING) private Status status;
    public enum Type { MENSUAL, ANUAL }
    public enum Status { ACTIVA, CANCELADA, PENDIENTE }
    public boolean isActive(){ return status==Status.ACTIVA && (endDate==null || !endDate.isBefore(LocalDate.now())); }
}
