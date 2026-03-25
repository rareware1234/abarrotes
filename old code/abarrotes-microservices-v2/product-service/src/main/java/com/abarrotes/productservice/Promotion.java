package com.abarrotes.productservice;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Promotion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional=false) private Product product;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double memberPrice;
    private Double publicPrice;
    private Boolean active;
    public boolean isActive(LocalDate today){
        if (Boolean.FALSE.equals(active)) return false;
        boolean afterStart = (startDate==null) || !today.isBefore(startDate);
        boolean beforeEnd = (endDate==null) || !today.isAfter(endDate);
        return afterStart && beforeEnd;
    }
}
