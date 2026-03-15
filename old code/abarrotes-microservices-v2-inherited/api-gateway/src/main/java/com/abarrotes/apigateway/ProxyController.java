package com.abarrotes.apigateway;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api")
public class ProxyController {
    private final RestTemplate rt = new RestTemplate();
    @Value("${USERS_URL:http://localhost:8082}") String users;
    @Value("${PRODUCTS_URL:http://localhost:8083}") String products;
    @Value("${MEMBERS_URL:http://localhost:8084}") String members;
    @Value("${ORDERS_URL:http://localhost:8085}") String orders;
    @Value("${PAYMENTS_URL:http://localhost:8086}") String payments;

    @GetMapping("/users/**")
    public ResponseEntity<String> usersProxy(@RequestHeader(required=false) String auth, @RequestParam(required=false) String q){
        return ResponseEntity.ok(rt.getForObject(users + "/api/hello", String.class));
    }
    @GetMapping("/products/**")
    public ResponseEntity<String> productsProxy(){ return ResponseEntity.ok(rt.getForObject(products + "/api/hello", String.class)); }
    @GetMapping("/members/**")
    public ResponseEntity<String> membersProxy(){ return ResponseEntity.ok(rt.getForObject(members + "/api/hello", String.class)); }
    @GetMapping("/orders/**")
    public ResponseEntity<String> ordersProxy(){ return ResponseEntity.ok(rt.getForObject(orders + "/api/hello", String.class)); }
    @GetMapping("/payments/**")
    public ResponseEntity<String> paymentsProxy(){ return ResponseEntity.ok(rt.getForObject(payments + "/api/hello", String.class)); }
}
