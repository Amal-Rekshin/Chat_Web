package com.connecthub.connecthub.service;

import com.connecthub.connecthub.entity.AuditLog;
import com.connecthub.connecthub.entity.User;
import com.connecthub.connecthub.repository.AuditLogRepository;
import com.connecthub.connecthub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public void logAction(String adminUsername, String action, String details, String ipAddress) {
        User admin = userRepository.findByUsername(adminUsername).orElse(null);
        if (admin != null) {
            AuditLog log = AuditLog.builder()
                    .admin(admin)
                    .action(action)
                    .details(details)
                    .ipAddress(ipAddress)
                    .build();
            auditLogRepository.save(log);
        }
    }
}
