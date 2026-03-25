package com.abarrotes.efficient.product.repository;

import com.abarrotes.efficient.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findBySku(String sku);
    Optional<Product> findByBarcode(String barcode);
    
    // Búsqueda por nombre, SKU o código de barras
    @Query("SELECT p FROM Product p WHERE LOWER(p.name) LIKE %:query% OR LOWER(p.sku) LIKE %:query% OR (p.barcode IS NOT NULL AND LOWER(p.barcode) LIKE %:query%)")
    List<Product> searchProducts(@Param("query") String query);
}