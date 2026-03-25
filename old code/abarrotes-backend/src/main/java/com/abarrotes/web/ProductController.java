package com.abarrotes.web;

import com.abarrotes.domain.Producto;
import com.abarrotes.repository.ProductoRepository;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    record CreateProductDTO(@NotBlank String nombre, String descripcion, @Min(0) Double precio, @Min(0) Integer stock, String categoria){}
    private final ProductoRepository repo;
    public ProductController(ProductoRepository repo){ this.repo = repo; }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateProductDTO dto){
        var p = Producto.builder()
                .nombre(dto.nombre())
                .descripcion(dto.descripcion())
                .precio(dto.precio())
                .stock(dto.stock())
                .categoria(dto.categoria())
                .build();
        p = repo.save(p);
        return ResponseEntity.created(URI.create("/api/products/"+p.getId())).body(p);
    }

    @GetMapping
    public List<Producto> list(){ return repo.findAll(); }
}
