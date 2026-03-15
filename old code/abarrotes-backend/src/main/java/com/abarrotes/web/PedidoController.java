package com.abarrotes.web;

import com.abarrotes.domain.Pedido;
import com.abarrotes.domain.PedidoItem;
import com.abarrotes.domain.Producto;
import com.abarrotes.domain.Usuario;
import com.abarrotes.repository.PedidoRepository;
import com.abarrotes.repository.ProductoRepository;
import com.abarrotes.repository.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class PedidoController {
    private final PedidoRepository pedidoRepo;
    private final ProductoRepository productoRepo;
    private final UsuarioRepository usuarioRepo;

    public PedidoController(PedidoRepository pedidoRepo, ProductoRepository productoRepo, UsuarioRepository usuarioRepo) {
        this.pedidoRepo = pedidoRepo;
        this.productoRepo = productoRepo;
        this.usuarioRepo = usuarioRepo;
    }

    record CreateOrderDTO(Long userId, List<OrderItemDTO> items) {}
    record OrderItemDTO(Long productId, Integer quantity) {}

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateOrderDTO dto) {
        if (dto.items() == null || dto.items().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Sin items"));
        }

        Usuario usuario = usuarioRepo.findById(dto.userId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Pedido pedido = new Pedido();
        pedido.setUsuario(usuario);
        pedido.setFechaPedido(LocalDateTime.now());
        pedido.setEstado(Pedido.Estado.PENDIENTE);
        pedido.setTipo(Pedido.Tipo.UNICO);
        pedido.setItems(new java.util.ArrayList<>());

        double total = 0.0;
        for (OrderItemDTO itemDTO : dto.items()) {
            Producto producto = productoRepo.findById(itemDTO.productId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + itemDTO.productId()));

            PedidoItem item = new PedidoItem();
            item.setPedido(pedido);
            item.setProducto(producto);
            item.setCantidad(itemDTO.quantity());
            item.setPrecioUnitario(producto.getPrecio());
            item.setSubtotal(producto.getPrecio() * itemDTO.quantity());

            pedido.getItems().add(item);
            total += item.getSubtotal();
        }

        pedido.setMontoTotal(total);
        pedido = pedidoRepo.save(pedido);

        return ResponseEntity.created(URI.create("/api/orders/" + pedido.getId())).body(pedido);
    }

    @GetMapping
    public List<Pedido> list() {
        return pedidoRepo.findAll();
    }
}
