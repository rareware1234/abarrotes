package com.abarrotes.userservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@SpringBootApplication
@RestController
public class App {
    @Value("${spring.application.name:app}") String app;
    public static void main(String[] args) { SpringApplication.run(App.class, args); }
    @GetMapping("/api/hello") public Map<String,Object> hello() { return Map.of("service", app, "status","OK"); }
}
