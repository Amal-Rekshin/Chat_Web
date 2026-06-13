package com.connecthub.connecthub;

import com.connecthub.connecthub.entity.ChatType;
import com.connecthub.connecthub.entity.MessageType;
import com.connecthub.connecthub.entity.Role;
import com.connecthub.connecthub.entity.User;
import com.connecthub.connecthub.entity.UserStatus;
import com.connecthub.connecthub.repository.ChatTypeRepository;
import com.connecthub.connecthub.repository.MessageTypeRepository;
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
    private final ChatTypeRepository chatTypeRepository;
    private final MessageTypeRepository messageTypeRepository;

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

        // Initialize Chat Types
        if (chatTypeRepository.findByName("GROUP").isEmpty()) {
            chatTypeRepository.save(ChatType.builder().name("GROUP").build());
        }
        if (chatTypeRepository.findByName("PRIVATE").isEmpty()) {
            chatTypeRepository.save(ChatType.builder().name("PRIVATE").build());
        }
        if (chatTypeRepository.findByName("ANNOUNCEMENT").isEmpty()) {
            chatTypeRepository.save(ChatType.builder().name("ANNOUNCEMENT").build());
        }

        // Initialize Message Types
        if (messageTypeRepository.findByName("TEXT").isEmpty()) {
            messageTypeRepository.save(MessageType.builder().name("TEXT").build());
        }
        if (messageTypeRepository.findByName("IMAGE").isEmpty()) {
            messageTypeRepository.save(MessageType.builder().name("IMAGE").build());
        }
        if (messageTypeRepository.findByName("FILE").isEmpty()) {
            messageTypeRepository.save(MessageType.builder().name("FILE").build());
        }

        // Initialize Default Users if not present
        if (userRepository.count() == 0) {
            Role adminRole = roleRepository.findByName("ADMIN").orElseThrow();
            UserStatus offlineStatus = userStatusRepository.findByName("OFFLINE").orElseThrow();

            List<User> defaultUsers = Arrays.asList(
                    User.builder().username("Rekshin").fullName("Rekshin").email("amalrekshin@gmail.com").password(passwordEncoder.encode("rekshin#01")).role(adminRole).status(offlineStatus).build()
            );
            userRepository.saveAll(defaultUsers);
        } else {
            // Hotfix: Automatically repair the invalid password hash that was manually inserted via data.sql
            userRepository.findByUsername("Rekshin").ifPresent(admin -> {
                admin.setPassword(passwordEncoder.encode("rekshin#01"));
                userRepository.save(admin);
            });
        }
    }
}