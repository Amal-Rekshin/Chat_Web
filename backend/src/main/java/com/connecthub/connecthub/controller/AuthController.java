package com.connecthub.connecthub.controller;

import com.connecthub.connecthub.dto.AuthRequest;
import com.connecthub.connecthub.dto.AuthResponse;
import com.connecthub.connecthub.dto.RegisterRequest;
import com.connecthub.connecthub.entity.Role;
import com.connecthub.connecthub.entity.User;
import com.connecthub.connecthub.entity.UserStatus;
import com.connecthub.connecthub.repository.UserRepository;
import com.connecthub.connecthub.repository.RoleRepository;
import com.connecthub.connecthub.repository.UserStatusRepository;
import com.connecthub.connecthub.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserStatusRepository userStatusRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest authRequest) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
        );

        User user = userRepository.findByUsernameOrEmail(authRequest.getUsername(), authRequest.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtUtil.generateToken(user.getUsername());
        return ResponseEntity.ok(new AuthResponse(token, user.getId(), user.getUsername(), user.getEmail(), user.getRole().getName()));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email is already taken");
        }

        Role userRole = roleRepository.findByName("USER").orElseThrow(() -> new RuntimeException("Default Role not found"));
        UserStatus defaultStatus = userStatusRepository.findByName("OFFLINE").orElseThrow(() -> new RuntimeException("Default Status not found"));

        User user = User.builder()
                .username(request.getUsername())
                .fullName(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(userRole)
                .status(defaultStatus)
                .build();

        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body("User registered successfully");
    }
}
