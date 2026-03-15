package com.abarrotes.orderservice;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepo repo;
    private final RestTemplate rt;
    @Value("${PRODUCTS_URL:http://localhost:8083}") String productsUrl;
    @Value("${MEMBERS_URL:http://localhost:8084}") String membersUrl;

    public OrderController(OrderRepo repo, RestTemplate rt){
        this.repo = repo;
        this.rt = rt;
    }

    record Item(Long productId, Integer qty){}
    record CreateOrder(Long userId, List<Item> items){}
    record PriceResponse(Double price, String source){}

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateOrder dto){
        if (dto.items()==null || dto.items().isEmpty()) return ResponseEntity.badRequest().body(Map.of("message","Sin items"));
        // 1) saber si el user es miembro
        var activeResp = rt.getForObject(membersUrl + "/api/memberships/user/"+dto.userId()+"/active", Map.class);
        boolean isMember = activeResp!=null && Boolean.TRUE.equals(activeResp.get("active"));

        // 2) sumar totales pidiendo precios al product-service y restando stock
        double total = 0.0;
        for (var it : dto.items()){
            var pr = rt.getForObject(productsUrl + "/api/products/"+it.productId()+"/price?member=" + isMember, PriceResponse.class);
            if (pr==null) return ResponseEntity.badRequest().body(Map.of("message","Producto no encontrado "+it.productId()));
            total += (pr.price() * it.qty());
            // descontar stock
            rt.postForEntity(productsUrl + "/api/products/"+it.productId()+"/decrement?qty="+it.qty(), null, String.class);
        }

        // 3) envío gratis si miembro + total >= 150 y no usó hoy
        boolean free = false;
        if (isMember && total >= 150.0){
            LocalDate today = LocalDate.now();
            boolean used = !repo.findByUserIdAndFreeShippingTrueAndCreatedAtBetween(dto.userId(), today.atStartOfDay(), today.atTime(LocalTime.MAX)).isEmpty();
            free = !used;
        }

        var order = Order.builder().userId(dto.userId()).total(total).freeShipping(free).build();
        order = repo.save(order);
        return ResponseEntity.created(URI.create("/api/orders/"+order.getId())).body(order);
    }

    @GetMapping public List<Order> list(){ return repo.findAll(); }
}
