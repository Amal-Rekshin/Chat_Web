package com.connecthub.connecthub.controller;

import com.connecthub.connecthub.entity.Chat;
import com.connecthub.connecthub.entity.Message;
import com.connecthub.connecthub.repository.ChatRepository;
import com.connecthub.connecthub.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import java.util.List;
import java.util.Map;
import org.springframework.transaction.annotation.Transactional;

import com.connecthub.connecthub.dto.CreateGroupRequest;
import com.connecthub.connecthub.service.ChatService;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public record MessageReceiptPayload(Long chatId, Long userId, Long lastDeliveredId, Long lastReadId) {}

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<com.connecthub.connecthub.dto.ChatDTO>> getUserChats(@PathVariable Long userId) {
        return ResponseEntity.ok(chatService.getUserChats(userId));
    }

    @Transactional
    @GetMapping("/{chatId}/messages")
    public ResponseEntity<List<com.connecthub.connecthub.dto.ChatMessagePayload>> getChatMessages(@PathVariable Long chatId) {
        List<Message> messages = messageRepository.findByChatIdOrderByCreatedAtAsc(chatId);
        List<com.connecthub.connecthub.dto.ChatMessagePayload> dtos = messages.stream().map(m -> {
            String fileUrl = null;
            if (m.getAttachments() != null && !m.getAttachments().isEmpty()) {
                fileUrl = m.getAttachments().get(0).getFileUrl();
            }
            return new com.connecthub.connecthub.dto.ChatMessagePayload(
                m.getId(),
                chatId,
                m.getSender() != null ? m.getSender().getId() : null,
                m.getContent(),
                m.getMessageType() != null ? m.getMessageType().getName() : "TEXT",
                fileUrl,
                m.getCreatedAt(),
                m.getSender() != null ? m.getSender().getUsername() : "Unknown",
                m.getIsEdited(),
                m.getReplyToMessage() != null ? m.getReplyToMessage().getId() : null,
                m.getReplyToMessage() != null ? m.getReplyToMessage().getContent() : null,
                m.getReplyToMessage() != null && m.getReplyToMessage().getSender() != null ? m.getReplyToMessage().getSender().getUsername() : null
            );
        }).toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{chatId}/info")
    public ResponseEntity<com.connecthub.connecthub.dto.ChatInfoDTO> getChatInfo(
            @PathVariable Long chatId, 
            @RequestParam Long userId) {
        try {
            return ResponseEntity.ok(chatService.getChatInfo(chatId, userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/group")
    public ResponseEntity<Chat> createGroupChat(@RequestBody CreateGroupRequest request) {
        return ResponseEntity.ok(chatService.createGroupChat(request));
    }

    @PostMapping("/private")
    public ResponseEntity<com.connecthub.connecthub.dto.ChatDTO> createPrivateChat(@RequestBody com.connecthub.connecthub.dto.CreatePrivateChatRequest request) {
        Chat chat = chatService.createPrivateChat(request.getSenderId(), request.getReceiverId());
        // Return as DTO immediately
        String otherName = chatService.getOtherMemberName(chat.getId(), request.getSenderId());
        com.connecthub.connecthub.dto.ChatDTO dto = com.connecthub.connecthub.dto.ChatDTO.builder()
                .id(chat.getId())
                .type(chat.getChatType().getName())
                .name(otherName != null ? otherName : chat.getName())
                .image(chat.getImageUrl())
                .createdById(chat.getCreatedBy().getId())
                .createdAt(chat.getCreatedAt())
                .build();
        return ResponseEntity.ok(dto);
    }

    public record AddMembersRequest(Long requesterId, List<Long> userIds) {}

    @PostMapping("/{chatId}/members")
    public ResponseEntity<?> addMembers(@PathVariable Long chatId, @RequestBody AddMembersRequest request) {
        try {
            chatService.addGroupMembers(chatId, request.userIds(), request.requesterId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{chatId}/members/{userId}")
    public ResponseEntity<?> removeMember(@PathVariable Long chatId, @PathVariable Long userId, @RequestParam Long requesterId) {
        try {
            chatService.removeGroupMember(chatId, userId, requesterId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{chatId}/members/{userId}/role")
    public ResponseEntity<?> updateMemberRole(@PathVariable Long chatId, @PathVariable Long userId, @RequestParam Long requesterId, @RequestParam String role) {
        try {
            chatService.updateMemberRole(chatId, userId, requesterId, role);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{chatId}/member-status")
    public ResponseEntity<List<com.connecthub.connecthub.dto.MemberStatusDTO>> getMemberStatus(@PathVariable Long chatId) {
        return ResponseEntity.ok(chatService.getMemberStatuses(chatId));
    }

    @PostMapping("/{chatId}/read")
    public ResponseEntity<Void> markChatAsRead(@PathVariable Long chatId, @RequestBody java.util.Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        chatService.markChatAsRead(chatId, userId);
        broadcastStatus(chatId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{chatId}/delivered")
    public ResponseEntity<Void> markChatAsDelivered(@PathVariable Long chatId, @RequestBody java.util.Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        chatService.markChatAsDelivered(chatId, userId);
        broadcastStatus(chatId, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{chatId}")
    public ResponseEntity<?> deleteChat(@PathVariable Long chatId, @RequestParam Long requesterId) {
        try {
            chatService.deleteChat(chatId, requesterId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private void broadcastStatus(Long chatId, Long userId) {
        // Fetch the updated status for this user
        List<com.connecthub.connecthub.dto.MemberStatusDTO> statuses = chatService.getMemberStatuses(chatId);
        com.connecthub.connecthub.dto.MemberStatusDTO userStatus = statuses.stream()
            .filter(s -> s.getUserId().equals(userId))
            .findFirst()
            .orElse(null);
            
        if (userStatus != null) {
            MessageReceiptPayload receipt = new MessageReceiptPayload(
                chatId, userId, userStatus.getLastDeliveredId(), userStatus.getLastReadId()
            );
            messagingTemplate.convertAndSend("/topic/chat/" + chatId + "/status", receipt);
        }
    }
}
