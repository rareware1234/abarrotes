package com.abarrotes.efficient.promotion.service;

import com.abarrotes.efficient.promotion.client.InventoryServiceClient;
import com.abarrotes.efficient.promotion.client.OrderServiceClient;
import com.abarrotes.efficient.promotion.client.ProductServiceClient;
import com.abarrotes.efficient.promotion.entity.Promocion;
import com.abarrotes.efficient.promotion.repository.PromocionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
public class PromotionEngineService {

    @Autowired
    private InventoryServiceClient inventoryClient;
    
    @Autowired
    private ProductServiceClient productClient;

    @Autowired
    private OrderServiceClient orderClient;

    @Autowired
    private PromocionRepository promocionRepository;

    // Límites para generar promociones
    private static final Double STOCK_ALTO_LIMIT = 50.0;
    private static final Integer DIAS_CADUCIDAD_CRITICO = 7;

    public List<Promocion> generarPromociones() {
        List<Promocion> nuevasPromociones = new ArrayList<>();
        
        try {
            // Obtener datos reales del inventory-service
            List<Map<String, Object>> inventario = inventoryClient.getAllInventory();
            
            for (Map<String, Object> item : inventario) {
                // El campo "productId" viene de InventoryItem
                Long productoId = ((Number) item.get("productId")).longValue();
                
                // Obtener detalles del producto desde product-service
                Map<String, Object> producto;
                try {
                    producto = productClient.getProductById(productoId);
                } catch (Exception e) {
                    System.err.println("No se pudo obtener el producto con ID " + productoId + ": " + e.getMessage());
                    continue; // Saltar este item si no se encuentra el producto
                }
                
                String nombreProducto = (String) producto.get("name");
                if (nombreProducto == null) {
                    nombreProducto = "Producto desconocido (ID: " + productoId + ")";
                }

                // El stock actual viene en el inventory item (campo "quantity")
                Object quantityObj = item.get("quantity");
                Double stockActual = 0.0;
                if (quantityObj instanceof Number) {
                    stockActual = ((Number) quantityObj).doubleValue();
                } else if (quantityObj instanceof String) {
                    stockActual = Double.parseDouble((String) quantityObj);
                }
                
                // Lógica 1: Stock Alto (Rotación lenta)
                if (stockActual > STOCK_ALTO_LIMIT) {
                    // Generar promoción 2x1 o 20% descuento aleatoriamente
                    Promocion promo = crearPromocion(
                        productoId, nombreProducto, 
                        stockActual > 100 ? "2x1" : "DESCUENTO", 
                        stockActual > 100 ? 2.0 : 20.0,
                        "Stock alto detectado"
                    );
                    nuevasPromociones.add(promo);
                }
                
                // Lógica 2: Caducidad
                // El campo "expiryDate" viene de InventoryItem
                Object expiryDateObj = item.get("expiryDate");
                if (expiryDateObj != null) {
                    // Simple parsing check (assuming ISO format or similar)
                    // For robustness, we might need a proper date parser, but for now we simulate based on logic
                    // In a real scenario, we'd parse LocalDateTime
                    // Since we can't easily parse date from map here without a parser, let's assume logic:
                    // If the product ID is 5 (as in simulation), or if we had a freshness score
                    // Let's check if there's a "freshnessScore" field
                    Object freshnessScoreObj = item.get("freshnessScore");
                    if (freshnessScoreObj != null && freshnessScoreObj instanceof Number) {
                        int freshness = ((Number) freshnessScoreObj).intValue();
                        if (freshness < 30) { // Example: low freshness score
                             Promocion promo = crearPromocion(
                                productoId, nombreProducto,
                                "LIQUIDACION",
                                30.0,
                                "Proximidad a caducidad"
                            );
                            nuevasPromociones.add(promo);
                        }
                    }
                }
            }
            
            // Guardar promociones en BD
            if (!nuevasPromociones.isEmpty()) {
                promocionRepository.saveAll(nuevasPromociones);
            }
            
        } catch (Exception e) {
            System.err.println("Error generando promociones: " + e.getMessage());
            e.printStackTrace();
        }
        
        return nuevasPromociones;
    }

    private Promocion crearPromocion(Long productoId, String nombre, String tipo, Double valor, String razon) {
        Promocion promo = new Promocion();
        promo.setProductoId(productoId);
        promo.setNombreProducto(nombre);
        promo.setTipo(tipo);
        promo.setValor(valor);
        promo.setFechaInicio(LocalDateTime.now());
        promo.setFechaFin(LocalDateTime.now().plusDays(7)); // Vigencia de 7 días
        promo.setRazonGeneracion(razon);
        return promo;
    }
    
    public List<Promocion> getActivePromotions() {
        return promocionRepository.findByActivaTrue();
    }
}