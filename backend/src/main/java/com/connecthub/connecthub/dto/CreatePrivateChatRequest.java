package com.connecthub.connecthub.dto;

import lombok.Data;

@Data
public class CreatePrivateChatRequest {
    private Long senderId;
    private Long receiverId;
}
