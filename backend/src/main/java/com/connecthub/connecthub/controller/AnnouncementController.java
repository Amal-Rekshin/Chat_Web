package com.connecthub.connecthub.controller;

import com.connecthub.connecthub.entity.Announcement;
import com.connecthub.connecthub.entity.User;
import com.connecthub.connecthub.entity.Chat;
import com.connecthub.connecthub.entity.Message;
import com.connecthub.connecthub.entity.MessageType;
import com.connecthub.connecthub.dto.ChatMessagePayload;
import com.connecthub.connecthub.repository.AnnouncementRepository;
import com.connecthub.connecthub.repository.UserRepository;
import com.connecthub.connecthub.repository.ChatRepository;
import com.connecthub.connecthub.repository.MessageRepository;
import com.connecthub.connecthub.repository.MessageTypeRepository;
import com.connecthub.connecthub.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;
    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final MessageTypeRepository messageTypeRepository;
    private final AuditService auditService;
    private final SimpMessagingTemplate messagingTemplate;

    public record AnnouncementDTO(Long id, String title, String content, String createdBy, LocalDateTime createdAt) {}
    public record CreateAnnouncementRequest(String title, String content) {}

    private String getCurrentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping
    public ResponseEntity<List<AnnouncementDTO>> getAnnouncements() {
        List<AnnouncementDTO> dtos = announcementRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(a -> new AnnouncementDTO(a.getId(), a.getTitle(), a.getContent(), a.getCreatedBy().getUsername(), a.getCreatedAt()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AnnouncementDTO> createAnnouncement(@RequestBody CreateAnnouncementRequest request, jakarta.servlet.http.HttpServletRequest httpRequest) {
        String username = getCurrentUsername();
        User admin = userRepository.findByUsername(username).orElseThrow();

        Announcement announcement = Announcement.builder()
                .title(request.title())
                .content(request.content())
                .createdBy(admin)
                .build();

        Announcement saved = announcementRepository.save(announcement);
        
        auditService.logAction(username, "CREATE_ANNOUNCEMENT", "Created announcement: " + saved.getTitle(), httpRequest.getRemoteAddr());

        AnnouncementDTO dto = new AnnouncementDTO(saved.getId(), saved.getTitle(), saved.getContent(), saved.getCreatedBy().getUsername(), saved.getCreatedAt());
        
        // Broadcast via WebSocket (Original Announcement banner)
        messagingTemplate.convertAndSend("/topic/announcements", dto);
        
        // Post to the ANNOUNCEMENT chat channel
        List<Chat> annChats = chatRepository.findByType("ANNOUNCEMENT");
        if (!annChats.isEmpty()) {
            Chat annChat = annChats.get(0);
            MessageType textType = messageTypeRepository.findByName("TEXT").orElseThrow();
            
            Message message = Message.builder()
                .chat(annChat)
                .sender(admin)
                .content("📢 **" + saved.getTitle() + "**\n\n" + saved.getContent())
                .messageType(textType)
                .build();
            message = messageRepository.save(message);

            ChatMessagePayload payload = new ChatMessagePayload(
                message.getId(),
                annChat.getId(),
                admin.getId(),
                message.getContent(),
                "TEXT",
                null,
                message.getCreatedAt(),
                admin.getUsername(),
                false
            );
            messagingTemplate.convertAndSend("/topic/chat/" + annChat.getId(), payload);
        }

        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAnnouncement(@PathVariable Long id, jakarta.servlet.http.HttpServletRequest httpRequest) {
        return announcementRepository.findById(id).map(ann -> {
            announcementRepository.delete(ann);
            auditService.logAction(getCurrentUsername(), "DELETE_ANNOUNCEMENT", "Deleted announcement: " + ann.getTitle(), httpRequest.getRemoteAddr());
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
