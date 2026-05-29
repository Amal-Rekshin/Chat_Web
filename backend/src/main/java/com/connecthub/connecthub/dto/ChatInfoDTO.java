package com.connecthub.connecthub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatInfoDTO {
    // Shared
    private Long id;
    private String type;
    private String name;
    private String image;
    private LocalDateTime createdAt;
    
    // Private Chat specific
    private String bio;
    private String email;
    private String status;
    private LocalDateTime lastSeen;

    // Group Chat specific
    private List<ChatInfoMemberDTO> members;
    private Long memberCount;
    private String createdByUsername;
}
