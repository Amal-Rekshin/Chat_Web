package com.connecthub.connecthub.controller;

import com.connecthub.connecthub.entity.AuditLog;
import com.connecthub.connecthub.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    public record AuditLogDTO(Long id, String adminUsername, String action, String details, String ipAddress, java.time.LocalDateTime timestamp) {}

    @GetMapping
    public ResponseEntity<List<AuditLogDTO>> getAuditLogs() {
        List<AuditLogDTO> logs = auditLogRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(log -> new AuditLogDTO(
                        log.getId(),
                        log.getAdmin().getUsername(),
                        log.getAction(),
                        log.getDetails(),
                        log.getIpAddress(),
                        log.getCreatedAt()
                )).collect(Collectors.toList());
        return ResponseEntity.ok(logs);
    }
}
