package com.abarrotes.efficient.caja;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class CajaServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(CajaServiceApplication.class, args);
    }
}