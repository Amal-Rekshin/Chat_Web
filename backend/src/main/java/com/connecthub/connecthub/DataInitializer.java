package com.connecthub.connecthub;

import com.connecthub.connecthub.entity.Role;
import com.connecthub.connecthub.entity.User;
import com.connecthub.connecthub.entity.UserStatus;
import com.connecthub.connecthub.repository.RoleRepository;
import com.connecthub.connecthub.repository.UserRepository;
import com.connecthub.connecthub.repository.UserStatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserStatusRepository userStatusRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Initialize Roles
        if (roleRepository.count() == 0) {
            roleRepository.save(Role.builder().name("USER").description("Standard User").build());
            roleRepository.save(Role.builder().name("ADMIN").description("Administrator").build());
        }

        // Initialize Statuses
        if (userStatusRepository.count() == 0) {
            userStatusRepository.save(UserStatus.builder().name("ONLINE").build());
            userStatusRepository.save(UserStatus.builder().name("OFFLINE").build());
            userStatusRepository.save(UserStatus.builder().name("AWAY").build());
        }

        // Initialize Default Users if not present
        if (userRepository.count() == 0) {
        Role adminRole = roleRepository.findByName("ADMIN").orElseThrow();
        Role userRole = roleRepository.findByName("USER").orElseThrow();
        UserStatus offlineStatus = userStatusRepository.findByName("OFFLINE").orElseThrow();

        List<User> defaultUsers = Arrays.asList(
                    User.builder().username("Roriri").fullName("Roriri").email("roriri@example.com").password(passwordEncoder.encode("roriri")).role(adminRole).status(offlineStatus).build()
        );

            userRepository.saveAll(defaultUsers);
        }
    }
}
