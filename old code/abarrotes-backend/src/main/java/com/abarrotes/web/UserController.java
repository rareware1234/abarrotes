package com.abarrotes.web;

import com.abarrotes.domain.Usuario;
import com.abarrotes.repository.UsuarioRepository;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    record CreateUserDTO(@NotBlank String nombre, @Email String email, String telefono, String direccion) {}
    private final UsuarioRepository repo;
    public UserController(UsuarioRepository repo){ this.repo = repo; }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateUserDTO dto){
        if (repo.findByEmail(dto.email()).isPresent()){
            return ResponseEntity.badRequest().body(ApiError.of("Email ya registrado", 400));
        }
        var u = Usuario.builder()
                .nombre(dto.nombre())
                .email(dto.email())
                .telefono(dto.telefono())
                .direccion(dto.direccion())
                .build();
        u = repo.save(u);
        return ResponseEntity.created(URI.create("/api/users/"+u.getId())).body(u);
    }

    @GetMapping
    public List<Usuario> list(){ return repo.findAll(); }
}
