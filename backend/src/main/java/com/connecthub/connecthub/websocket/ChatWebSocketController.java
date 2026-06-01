package com.connecthub.connecthub.websocket;

import com.connecthub.connecthub.dto.ChatMessagePayload;
import com.connecthub.connecthub.repository.ChatRepository;
import com.connecthub.connecthub.repository.MessageRepository;
import com.connecthub.connecthub.repository.UserRepository;
import com.connecthub.connecthub.repository.ChatMemberRepository;
import com.connecthub.connecthub.repository.MessageTypeRepository;
import com.connecthub.connecthub.repository.AttachmentRepository;
import com.connecthub.connecthub.entity.ChatMember;
import com.connecthub.connecthub.entity.Message;
import com.connecthub.connecthub.entity.MessageType;
import com.connecthub.connecthub.entity.Attachment;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Collections;

@Controller
@RequiredArgsConstructor
@Transactional
public class ChatWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final MessageTypeRepository messageTypeRepository;
    private final AttachmentRepository attachmentRepository;
    private final com.connecthub.connecthub.service.AdminStatsService adminStatsService;

    @MessageMapping("/chat/{chatId}/sendMessage")
    public void sendMessage(@DestinationVariable Long chatId, @Payload ChatMessagePayload payload) {
        com.connecthub.connecthub.entity.Chat chat = chatRepository.findById(chatId).orElseThrow();
        com.connecthub.connecthub.entity.User sender = userRepository.findById(payload.getSenderId()).orElseThrow();

        if ("ANNOUNCEMENT".equals(chat.getChatType().getName()) && !"ADMIN".equals(sender.getRole().getName())) {
            throw new RuntimeException("Only Admins can send announcements");
        }

        MessageType type = messageTypeRepository.findByName(payload.getMessageType() != null ? payload.getMessageType() : "TEXT")
            .orElseThrow(() -> new RuntimeException("Message Type not found"));

        // Handle reply
        Message replyTo = null;
        if (payload.getReplyToMessageId() != null) {
            replyTo = messageRepository.findById(payload.getReplyToMessageId()).orElse(null);
        }

        // Save message to DB
        Message message = Message.builder()
                .chat(chat)
                .sender(sender)
                .content(payload.getContent())
                .messageType(type)
                .replyToMessage(replyTo)
                .build();
        
        message = messageRepository.save(message);

        // Handle attachments if any
        if (payload.getFileUrl() != null && !payload.getFileUrl().trim().isEmpty()) {
            Attachment attachment = Attachment.builder()
                .message(message)
                .fileUrl(payload.getFileUrl())
                .fileName(payload.getContent()) // Since we put file name in content
                .build();
            attachmentRepository.save(attachment);
            message.setAttachments(Collections.singletonList(attachment));
        }

        ChatMember senderMember = chatMemberRepository.findByChatIdAndUserId(chatId, sender.getId());
        if (senderMember != null) {
            senderMember.setLastReadId(message.getId());
            if (senderMember.getLastDeliveredId() == null || senderMember.getLastDeliveredId() < message.getId()) {
                senderMember.setLastDeliveredId(message.getId());
            }
            chatMemberRepository.save(senderMember);
        }

        payload.setId(message.getId());
        payload.setCreatedAt(message.getCreatedAt());
        payload.setSenderName(message.getSender().getUsername());
        payload.setIsEdited(message.getIsEdited());
        if (message.getReplyToMessage() != null) {
            payload.setReplyToMessageId(message.getReplyToMessage().getId());
            payload.setReplyToMessageContent(message.getReplyToMessage().getContent());
            payload.setReplyToSenderName(message.getReplyToMessage().getSender().getUsername());
        }

        // Broadcast to specific chat topic
        messagingTemplate.convertAndSend("/topic/chat/" + chatId, payload);
        
        // Broadcast new message alert to all members of the chat
        java.util.List<ChatMember> members = chatMemberRepository.findByChatId(chatId);
        for (ChatMember member : members) {
            messagingTemplate.convertAndSend("/topic/user/" + member.getUser().getId() + "/new_message", payload);
        }
        
        // Broadcast stats for admin dashboard
        adminStatsService.broadcastStats();
    }

    @MessageMapping("/chat/{chatId}/typing")
    public void sendTypingStatus(@DestinationVariable Long chatId, @Payload TypingPayload payload) {
        System.out.println("RECEIVED TYPING EVENT FOR CHAT " + chatId + " from " + payload.username() + ": " + payload.typing());
        messagingTemplate.convertAndSend("/topic/chat/" + chatId + "/typing", payload);
    }

    @MessageMapping("/chat/{chatId}/editMessage")
    public void editMessage(@DestinationVariable Long chatId, @Payload EditMessagePayload payload) {
        Message message = messageRepository.findById(payload.messageId()).orElseThrow();
        if (message.getCreatedAt().plusHours(1).isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Message cannot be edited after 1 hour");
        }
        message.setContent(payload.content());
        message.setIsEdited(true);
        message = messageRepository.save(message);

        String fileUrl = null;
        if (message.getAttachments() != null && !message.getAttachments().isEmpty()) {
            fileUrl = message.getAttachments().get(0).getFileUrl();
        }

        ChatMessagePayload responsePayload = new ChatMessagePayload(
            message.getId(),
            chatId,
            message.getSender().getId(),
            message.getContent(),
            message.getMessageType().getName(),
            fileUrl,
            message.getCreatedAt(),
            message.getSender().getUsername(),
            message.getIsEdited(),
            message.getReplyToMessage() != null ? message.getReplyToMessage().getId() : null,
            message.getReplyToMessage() != null ? message.getReplyToMessage().getContent() : null,
            message.getReplyToMessage() != null ? message.getReplyToMessage().getSender().getUsername() : null
        );
        messagingTemplate.convertAndSend("/topic/chat/" + chatId, responsePayload);
    }

    public record TypingPayload(Long userId, String username, boolean typing) {}
    public record EditMessagePayload(Long messageId, String content) {}
}
