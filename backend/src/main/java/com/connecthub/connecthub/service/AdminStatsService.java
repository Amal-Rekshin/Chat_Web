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

    public AdminDashboardDTO getDashboardStats() {
        long totalUsers = userRepository.count() - 1;
        long activeGroups = chatRepository.countByType("GROUP");
        long totalMessages = messageRepository.count();
        
        // Count online users by status = 'ONLINE'
        long onlineUsers = userRepository.findAll().stream()
                .filter(u -> u.getStatus() != null && "ONLINE".equals(u.getStatus().getName()))
                .count();

        java.util.List<Object[]> messageCounts = messageRepository.countMessagesPerDayLast7Days();
        java.util.List<Object[]> userCounts = userRepository.countUsersCreatedPerDayLast7Days();
        
        java.util.Map<String, AdminDashboardDTO.TrendData> trendMap = new java.util.LinkedHashMap<>();
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.format.DateTimeFormatter dayFormatter = java.time.format.DateTimeFormatter.ofPattern("EEE", java.util.Locale.US);
        
        for (int i = 6; i >= 0; i--) {
            java.time.LocalDate date = today.minusDays(i);
            String dateStr = date.toString();
            String dayName = date.format(dayFormatter);
            trendMap.put(dateStr, AdminDashboardDTO.TrendData.builder().name(dayName).messages(0).users(0).build());
        }
        
        for (Object[] row : messageCounts) {
            if (row[0] != null) {
                String dateStr = row[0].toString();
                if (trendMap.containsKey(dateStr)) {
                    trendMap.get(dateStr).setMessages(((Number) row[1]).longValue());
                }
            }
        }
        
        for (Object[] row : userCounts) {
            if (row[0] != null) {
                String dateStr = row[0].toString();
                if (trendMap.containsKey(dateStr)) {
                    trendMap.get(dateStr).setUsers(((Number) row[1]).longValue());
                }
            }
        }

        return AdminDashboardDTO.builder()
                .totalUsers(totalUsers)
                .activeGroups(activeGroups)
                .totalMessages(totalMessages)
                .onlineUsers(onlineUsers)
                .activityTrends(new java.util.ArrayList<>(trendMap.values()))
                .build();
    }

    public void broadcastStats() {
        AdminDashboardDTO stats = getDashboardStats();
        messagingTemplate.convertAndSend("/topic/admin/stats", stats);
    }
}
