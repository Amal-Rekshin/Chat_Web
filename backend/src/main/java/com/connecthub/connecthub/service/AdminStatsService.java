package com.connecthub.connecthub.service;

import com.connecthub.connecthub.dto.AdminDashboardDTO;
import com.connecthub.connecthub.repository.ChatRepository;
import com.connecthub.connecthub.repository.MessageRepository;
import com.connecthub.connecthub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminStatsService {

    private final UserRepository userRepository;
    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastStats() {
        long totalUsers = userRepository.count();
        long activeGroups = chatRepository.countByType("GROUP");
        long totalMessages = messageRepository.count();
        
        // Count online users by status = 'ONLINE'
        long onlineUsers = userRepository.findAll().stream()
                .filter(u -> "ONLINE".equals(u.getStatus()))
                .count();

        AdminDashboardDTO stats = AdminDashboardDTO.builder()
                .totalUsers(totalUsers)
                .activeGroups(activeGroups)
                .totalMessages(totalMessages)
                .onlineUsers(onlineUsers)
                .build();

        messagingTemplate.convertAndSend("/topic/admin/stats", stats);
    }
}
