package com.abarrotes.productservice;

import jakarta.persistence.*;
import lombok.*;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private Double price;
    private Integer stock;
    private Boolean active;
    @PrePersist
    void pre(){ if (active==null) active = true; if (stock==null) stock=0; }
}
