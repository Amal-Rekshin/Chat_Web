package com.connecthub.connecthub.service;

import com.connecthub.connecthub.dto.CreateGroupRequest;
import com.connecthub.connecthub.entity.Chat;
import com.connecthub.connecthub.entity.ChatMember;
import com.connecthub.connecthub.entity.User;
import com.connecthub.connecthub.entity.ChatType;
import com.connecthub.connecthub.entity.Message;
import com.connecthub.connecthub.repository.ChatMemberRepository;
import com.connecthub.connecthub.repository.ChatRepository;
import com.connecthub.connecthub.repository.UserRepository;
import com.connecthub.connecthub.repository.MessageRepository;
import com.connecthub.connecthub.repository.ChatTypeRepository;
import com.connecthub.connecthub.repository.RoleRepository;
import com.connecthub.connecthub.dto.MemberStatusDTO;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final ChatTypeRepository chatTypeRepository;
    private final RoleRepository roleRepository;

    @Transactional
    public Chat createGroupChat(CreateGroupRequest request) {
        User creator = userRepository.findById(request.getCreatedBy())
                .orElseThrow(() -> new RuntimeException("Creator not found"));

        ChatType groupType = chatTypeRepository.findByName("GROUP").orElseThrow();

        Chat chat = Chat.builder()
                .chatType(groupType)
                .name(request.getName())
                .imageUrl(request.getImage())
                .createdBy(creator)
                .build();

        chat = chatRepository.save(chat);

        ChatMember adminMember = ChatMember.builder()
                .chat(chat)
                .user(creator)
                .isAdmin(true)
                .build();
        chatMemberRepository.save(adminMember);

        if (request.getMemberIds() != null) {
            for (Long memberId : request.getMemberIds()) {
                if (!memberId.equals(creator.getId())) {
                    User memberUser = userRepository.findById(memberId).orElse(null);
                    if (memberUser != null) {
                        ChatMember member = ChatMember.builder()
                                .chat(chat)
                                .user(memberUser)
                                .isAdmin(false)
                                .build();
                        chatMemberRepository.save(member);
                    }
                }
            }
        }
        return chat;
    }

    @Transactional
    public void addGroupMembers(Long chatId, List<Long> userIds, Long requesterId) {
        Chat chat = chatRepository.findById(chatId)
            .orElseThrow(() -> new RuntimeException("Chat not found"));
            
        ChatMember requester = chatMemberRepository.findByChatIdAndUserId(chatId, requesterId);
        if (requester == null || !requester.getIsAdmin()) {
            throw new RuntimeException("Only group admins can add members");
        }
        
        for (Long userId : userIds) {
            ChatMember existing = chatMemberRepository.findByChatIdAndUserId(chatId, userId);
            if (existing == null) {
                User user = userRepository.findById(userId).orElse(null);
                if (user != null) {
                    ChatMember newMember = ChatMember.builder()
                        .chat(chat)
                        .user(user)
                        .isAdmin(false)
                        .build();
                    chatMemberRepository.save(newMember);
                }
            }
        }
    }

    @Transactional
    public Chat createPrivateChat(Long senderId, Long receiverId) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        
        if ("ADMIN".equals(sender.getRole().getName())) {
            throw new RuntimeException("Admins cannot use direct chat.");
        }
                
        List<Chat> existingChats = chatRepository.findPrivateChatBetweenUsers(senderId, receiverId);
        if (!existingChats.isEmpty()) {
            return existingChats.get(0);
        }

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        ChatType privateType = chatTypeRepository.findByName("PRIVATE").orElseThrow();

        Chat chat = Chat.builder()
                .chatType(privateType)
                .name("Private Chat")
                .createdBy(sender)
                .build();

        chat = chatRepository.save(chat);

        ChatMember senderMember = ChatMember.builder()
                .chat(chat)
                .user(sender)
                .isAdmin(false)
                .build();
        chatMemberRepository.save(senderMember);

        ChatMember receiverMember = ChatMember.builder()
                .chat(chat)
                .user(receiver)
                .isAdmin(false)
                .build();
        chatMemberRepository.save(receiverMember);

        return chat;
    }

    @Transactional
    public void removeGroupMember(Long chatId, Long userId, Long requesterId) {
        ChatMember requester = chatMemberRepository.findByChatIdAndUserId(chatId, requesterId);
        if (requester == null || !requester.getIsAdmin()) {
            throw new RuntimeException("Only group admins can remove members");
        }
        
        ChatMember target = chatMemberRepository.findByChatIdAndUserId(chatId, userId);
        if (target != null) {
            chatMemberRepository.delete(target);
        }
    }

    @Transactional
    public void updateMemberRole(Long chatId, Long userId, Long requesterId, String newRole) {
        ChatMember requester = chatMemberRepository.findByChatIdAndUserId(chatId, requesterId);
        if (requester == null || !requester.getIsAdmin()) {
            throw new RuntimeException("Only group admins can update roles");
        }
        
        ChatMember target = chatMemberRepository.findByChatIdAndUserId(chatId, userId);
        if (target != null) {
            target.setIsAdmin("ADMIN".equals(newRole));
            chatMemberRepository.save(target);
        }
    }

    public String getOtherMemberName(Long chatId, Long userId) {
        return chatMemberRepository.findOtherMemberUsername(chatId, userId);
    }

    @Transactional
    public void markChatAsRead(Long chatId, Long userId) {
    }

    @Transactional
    public void markChatAsDelivered(Long chatId, Long userId) {
    }

    public java.util.List<MemberStatusDTO> getMemberStatuses(Long chatId) {
        return java.util.Collections.emptyList();
    }

    @Transactional
    public java.util.List<com.connecthub.connecthub.dto.ChatDTO> getUserChats(Long userId) {
        // Ensure ANNOUNCEMENT chat exists
        java.util.List<Chat> annChats = chatRepository.findByType("ANNOUNCEMENT");
        Chat annChat;
        if (annChats.isEmpty()) {
            ChatType annType = chatTypeRepository.findByName("ANNOUNCEMENT").orElseThrow();
            User admin = userRepository.findByRole(roleRepository.findByName("ADMIN").get()).stream().findFirst().orElse(userRepository.findById(userId).get());
            Chat chat = Chat.builder()
                .chatType(annType)
                .name("System Announcements")
                .createdBy(admin)
                .build();
            annChat = chatRepository.save(chat);
        } else {
            annChat = annChats.get(0);
        }
        
        // Ensure user is member
        ChatMember memberCheck = chatMemberRepository.findByChatIdAndUserId(annChat.getId(), userId);
        if (memberCheck == null) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                ChatMember newMember = ChatMember.builder()
                    .chat(annChat)
                    .user(user)
                    .isAdmin(false)
                    .build();
                chatMemberRepository.save(newMember);
            }
        }

        java.util.List<Chat> chats = new java.util.ArrayList<>(chatRepository.findChatsByUserId(userId));
        boolean annExists = chats.stream().anyMatch(c -> c.getId().equals(annChat.getId()));
        if (!annExists) {
            chats.add(annChat);
        }
        
        return chats.stream().map(chat -> {
            String chatName = chat.getName();
            if ("PRIVATE".equals(chat.getChatType().getName())) {
                String otherName = chatMemberRepository.findOtherMemberUsername(chat.getId(), userId);
                if (otherName != null) {
                    chatName = otherName;
                }
            }
            
            ChatMember member = chatMemberRepository.findByChatIdAndUserId(chat.getId(), userId);
            Long unreadCount = 0L;
            String currentUserRole = member != null && member.getIsAdmin() ? "ADMIN" : "MEMBER";
            
            Message lastMessage = messageRepository.findFirstByChatIdOrderByCreatedAtDesc(chat.getId());
            
            Boolean canMessage = true;
            if ("GROUP".equals(chat.getChatType().getName())) {
                if (member == null) {
                    canMessage = false;
                }
            } else if ("PRIVATE".equals(chat.getChatType().getName())) {
                Long otherUserId = null;
                for (ChatMember cm : chatMemberRepository.findByChatId(chat.getId())) {
                    if (!cm.getUser().getId().equals(userId)) {
                        otherUserId = cm.getUser().getId();
                        break;
                    }
                }
                if (otherUserId != null) {
                    canMessage = chatRepository.hasMutualGroup(userId, otherUserId);
                }
            }

            return com.connecthub.connecthub.dto.ChatDTO.builder()
                    .id(chat.getId())
                    .type(chat.getChatType().getName())
                    .name(chatName)
                    .image(chat.getImageUrl())
                    .createdById(chat.getCreatedBy() != null ? chat.getCreatedBy().getId() : null)
                    .createdAt(chat.getCreatedAt())
                    .unreadCount(unreadCount)
                    .lastMessage(lastMessage != null ? lastMessage.getContent() : null)
                    .lastMessageAt(lastMessage != null ? lastMessage.getCreatedAt() : chat.getCreatedAt())
                    .currentUserRole(currentUserRole)
                    .canMessage(canMessage)
                    .build();
        })
        .sorted(java.util.Comparator.comparing((com.connecthub.connecthub.dto.ChatDTO c) -> "ANNOUNCEMENT".equals(c.getType()) ? 1 : 0).reversed()
            .thenComparing(java.util.Comparator.comparing(com.connecthub.connecthub.dto.ChatDTO::getLastMessageAt).reversed()))
        .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public com.connecthub.connecthub.dto.ChatInfoDTO getChatInfo(Long chatId, Long currentUserId) {
        Chat chat = chatRepository.findById(chatId)
            .orElseThrow(() -> new RuntimeException("Chat not found"));
            
        ChatMember currentMember = chatMemberRepository.findByChatIdAndUserId(chatId, currentUserId);
        if (currentMember == null) {
            throw new RuntimeException("User is not a member of this chat");
        }
        
        com.connecthub.connecthub.dto.ChatInfoDTO.ChatInfoDTOBuilder builder = com.connecthub.connecthub.dto.ChatInfoDTO.builder()
            .id(chat.getId())
            .type(chat.getChatType().getName())
            .createdAt(chat.getCreatedAt());
            
        if ("PRIVATE".equals(chat.getChatType().getName())) {
            List<ChatMember> members = chatMemberRepository.findByChatId(chatId);
            ChatMember otherMember = members.stream()
                .filter(m -> !m.getUser().getId().equals(currentUserId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Other member not found"));
                
            User otherUser = otherMember.getUser();
            builder.name(otherUser.getUsername())
                   .image(otherUser.getProfileImageUrl())
                   .email(otherUser.getEmail())
                   .status(otherUser.getStatus().getName())
                   .lastSeen(otherUser.getLastSeen());
        } else {
            builder.name(chat.getName())
                   .image(chat.getImageUrl())
                   .createdByUsername(chat.getCreatedBy() != null ? chat.getCreatedBy().getUsername() : null);
                   
            List<ChatMember> members = chatMemberRepository.findByChatId(chatId);
            List<com.connecthub.connecthub.dto.ChatInfoMemberDTO> memberDTOs = members.stream().map(m -> 
                com.connecthub.connecthub.dto.ChatInfoMemberDTO.builder()
                    .userId(m.getUser().getId())
                    .username(m.getUser().getUsername())
                    .email(m.getUser().getEmail())
                    .profileImage(m.getUser().getProfileImageUrl())
                    .role(m.getIsAdmin() ? "ADMIN" : "MEMBER")
                    .status(m.getUser().getStatus().getName())
                    .build()
            ).toList();
            
            builder.members(memberDTOs)
                   .memberCount((long) memberDTOs.size());
        }
        
        return builder.build();
    }
}
