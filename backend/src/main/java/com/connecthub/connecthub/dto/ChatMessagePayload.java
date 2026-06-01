package com.connecthub.connecthub.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatMessagePayload {
    private Long id;
    private Long chatId;
    private Long senderId;
    private String content;
    private String messageType;
    private String fileUrl;
    private LocalDateTime createdAt;
    private String senderName;
    private Boolean isEdited;
    private Long replyToMessageId;
    private String replyToMessageContent;
    private String replyToSenderName;
}
