package com.abarrotes.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {
    @GetMapping("/")
    public Map<String, Object> root(){
        return Map.of("app","abarrotes-backend","status","OK");
    }
}
