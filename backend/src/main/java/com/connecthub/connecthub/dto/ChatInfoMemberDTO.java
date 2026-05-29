package com.connecthub.connecthub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatInfoMemberDTO {
    private Long userId;
    private String username;
    private String email;
    private String profileImage;
    private String role;
    private String status;
}
