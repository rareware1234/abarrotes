package com.abarrotes.productservice;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/promotions")
public class PromotionController {
    private final PromotionRepo repo;
    private final ProductRepo products;
    public PromotionController(PromotionRepo repo, ProductRepo products){ this.repo=repo; this.products=products; }
    record CreatePromo(Long productId, String startDate, String endDate, Double memberPrice, Double publicPrice, Boolean active){}
    @PostMapping public ResponseEntity<?> create(@RequestBody CreatePromo dto){
        Product p = products.findById(dto.productId()).orElseThrow();
        var pr = Promotion.builder().product(p).memberPrice(dto.memberPrice()).publicPrice(dto.publicPrice()).active(dto.active()==null?true:dto.active()).build();
        pr = repo.save(pr);
        return ResponseEntity.created(URI.create("/api/promotions/"+pr.getId())).body(pr);
    }
    @GetMapping public List<Promotion> list(){ return repo.findAll(); }
}
