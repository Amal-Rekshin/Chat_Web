package com.connecthub.connecthub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardDTO {
    private long totalUsers;
    private long activeGroups;
    private long totalMessages;
    private long onlineUsers; // To be implemented with websocket presence
    private java.util.List<TrendData> activityTrends;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendData {
        private String name;
        private long messages;
        private long users;
    }
}
