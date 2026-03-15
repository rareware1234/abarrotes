package com.abarrotes.productservice;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductRepo products;
    private final PromotionRepo promos;
    public ProductController(ProductRepo products, PromotionRepo promos){ this.products=products; this.promos=promos; }

    @PostMapping public ResponseEntity<?> create(@RequestBody Product p){
        p = products.save(p);
        return ResponseEntity.created(URI.create("/api/products/"+p.getId())).body(p);
    }
    @GetMapping public List<Product> list(){ return products.findAll(); }

    record PriceResponse(Double price, String source) {}
    @GetMapping("/{id}/price")
    public ResponseEntity<?> price(@PathVariable Long id, @RequestParam(defaultValue="false") boolean member){
        Product p = products.findById(id).orElseThrow();
        double price = p.getPrice()==null?0.0:p.getPrice();
        String src="base";
        var list = promos.findByProduct_Id(id);
        LocalDate today = LocalDate.now();
        for (var pr: list){
            if (pr.isActive(today)){
                if (member && pr.getMemberPrice()!=null){ price = pr.getMemberPrice(); src="member-promo"; break; }
                if (!member && pr.getPublicPrice()!=null){ price = pr.getPublicPrice(); src="public-promo"; break; }
            }
        }
        return ResponseEntity.ok(new PriceResponse(price, src));
    }

    @PostMapping("/{id}/decrement")
    public ResponseEntity<?> decrement(@PathVariable Long id, @RequestParam Integer qty){
        Product p = products.findById(id).orElseThrow();
        int stock = p.getStock()==null?0:p.getStock();
        if (qty<=0 || qty>stock) return ResponseEntity.badRequest().body(Map.of("message","Stock insuficiente"));
        p.setStock(stock-qty);
        products.save(p);
        return ResponseEntity.ok(Map.of("id", p.getId(), "stock", p.getStock()));
    }
}
