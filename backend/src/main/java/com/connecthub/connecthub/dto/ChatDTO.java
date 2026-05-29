package com.connecthub.connecthub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatDTO {
    private Long id;
    private String type;
    private String name;
    private String image;
    private Long createdById;
    private LocalDateTime createdAt;
    private Long unreadCount;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private String currentUserRole;
    private Boolean canMessage;
}
