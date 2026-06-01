package com.connecthub.connecthub.controller;

import com.connecthub.connecthub.dto.AdminDashboardDTO;
import com.connecthub.connecthub.entity.User;
import com.connecthub.connecthub.entity.UserStatus;
import com.connecthub.connecthub.repository.ChatRepository;
import com.connecthub.connecthub.repository.MessageRepository;
import com.connecthub.connecthub.repository.UserRepository;
import com.connecthub.connecthub.repository.RoleRepository;
import com.connecthub.connecthub.repository.UserStatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final com.connecthub.connecthub.repository.ChatMemberRepository chatMemberRepository;
    private final RoleRepository roleRepository;
    private final UserStatusRepository userStatusRepository;
    private final com.connecthub.connecthub.service.AuditService auditService;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private String getCurrentUsername() {
        return org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private final com.connecthub.connecthub.service.AdminStatsService adminStatsService;

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardDTO> getDashboardStats() {
        return ResponseEntity.ok(adminStatsService.getDashboardStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PutMapping("/users/{id}/disable")
    public ResponseEntity<?> disableUser(@PathVariable Long id, jakarta.servlet.http.HttpServletRequest request) {
        return userRepository.findById(id).map(user -> {
            UserStatus offline = userStatusRepository.findByName("OFFLINE").orElseThrow();
            user.setStatus(offline); 
            userRepository.save(user);
            auditService.logAction(getCurrentUsername(), "DISABLE_USER", "Disabled user: " + user.getUsername(), request.getRemoteAddr());
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    public static class AdminUserRequestDTO {
        public String username;
        public String email;
        public String role;
        public String status;
        public String password;
        public List<Long> groupIds;
    }

    @GetMapping("/users/{id}/groups")
    public ResponseEntity<List<Long>> getUserGroups(@PathVariable Long id) {
        List<Long> groupIds = chatMemberRepository.findByUserId(id).stream()
                .filter(cm -> "GROUP".equals(cm.getChat().getChatType().getName()))
                .map(cm -> cm.getChat().getId())
                .toList();
        return ResponseEntity.ok(groupIds);
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody AdminUserRequestDTO requestDto, jakarta.servlet.http.HttpServletRequest request) {
        if (userRepository.existsByUsername(requestDto.username)) {
            return ResponseEntity.badRequest().body("Username already taken");
        }
        if (userRepository.existsByEmail(requestDto.email)) {
            return ResponseEntity.badRequest().body("Email already taken");
        }
        
        User user = new User();
        user.setUsername(requestDto.username);
        user.setFullName(requestDto.username);
        user.setEmail(requestDto.email);
        String roleName = requestDto.role != null ? requestDto.role : "USER";
        user.setRole(roleRepository.findByName(roleName).orElseThrow());
        
        String statusName = requestDto.status != null ? requestDto.status : "OFFLINE";
        user.setStatus(userStatusRepository.findByName(statusName).orElseThrow());
        
        
        String rawPassword = requestDto.password != null && !requestDto.password.isEmpty() ? requestDto.password : "adminpass";
        user.setPassword(passwordEncoder.encode(rawPassword)); 

        User savedUser = userRepository.save(user);
        
        if (requestDto.groupIds != null) {
            syncUserGroups(savedUser, requestDto.groupIds);
        }
        
        auditService.logAction(getCurrentUsername(), "CREATE_USER", "Created user: " + savedUser.getUsername(), request.getRemoteAddr());
        return ResponseEntity.ok(savedUser);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody AdminUserRequestDTO requestDto, jakarta.servlet.http.HttpServletRequest request) {
        return userRepository.findById(id).map(user -> {
            user.setUsername(requestDto.username);
            user.setFullName(requestDto.username);
            user.setEmail(requestDto.email);
            if (requestDto.role != null) {
                user.setRole(roleRepository.findByName(requestDto.role).orElseThrow());
            }
            if (requestDto.status != null) {
                user.setStatus(userStatusRepository.findByName(requestDto.status).orElseThrow());
            }
            if (requestDto.password != null && !requestDto.password.isEmpty()) {
                user.setPassword(passwordEncoder.encode(requestDto.password));
            }
            User updatedUser = userRepository.save(user);
            
            if (requestDto.groupIds != null) {
                syncUserGroups(updatedUser, requestDto.groupIds);
            }
            
            auditService.logAction(getCurrentUsername(), "UPDATE_USER", "Updated user: " + updatedUser.getUsername(), request.getRemoteAddr());
            return ResponseEntity.ok(updatedUser);
        }).orElse(ResponseEntity.notFound().build());
    }

    private void syncUserGroups(User user, List<Long> groupIds) {
        List<com.connecthub.connecthub.entity.ChatMember> existingMemberships = chatMemberRepository.findByUserId(user.getId()).stream()
            .filter(cm -> "GROUP".equals(cm.getChat().getChatType().getName()))
            .toList();
            
        List<Long> existingGroupIds = existingMemberships.stream()
            .map(cm -> cm.getChat().getId())
            .toList();
            
        // Remove from groups not in the new list
        for (com.connecthub.connecthub.entity.ChatMember cm : existingMemberships) {
            if (!groupIds.contains(cm.getChat().getId())) {
                chatMemberRepository.delete(cm);
            }
        }
        
        // Add to new groups
        for (Long groupId : groupIds) {
            if (!existingGroupIds.contains(groupId)) {
                chatRepository.findById(groupId).ifPresent(chat -> {
                    if ("GROUP".equals(chat.getChatType().getName())) {
                        com.connecthub.connecthub.entity.ChatMember newMember = com.connecthub.connecthub.entity.ChatMember.builder()
                            .chat(chat)
                            .user(user)
                            .isAdmin(false)
                            .build();
                        chatMemberRepository.save(newMember);
                    }
                });
            }
        }
    }


    // --- Group Endpoints ---
    @GetMapping("/groups")
    public ResponseEntity<?> getAllGroups() {
        List<com.connecthub.connecthub.entity.Chat> groups = chatRepository.findByType("GROUP");
        List<java.util.Map<String, Object>> response = new java.util.ArrayList<>();
        for (com.connecthub.connecthub.entity.Chat chat : groups) {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", chat.getId());
            map.put("name", chat.getName());
            map.put("description", chat.getImageUrl() != null ? chat.getImageUrl() : ""); // Use image field as description if needed, or leave empty
            
            List<com.connecthub.connecthub.entity.ChatMember> members = chatMemberRepository.findByChatId(chat.getId());
            List<java.util.Map<String, Object>> memberList = new java.util.ArrayList<>();
            for (com.connecthub.connecthub.entity.ChatMember cm : members) {
                java.util.Map<String, Object> m = new java.util.HashMap<>();
                m.put("userId", cm.getUser().getId());
                memberList.add(m);
            }
            map.put("members", memberList);
            response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/groups/{id}")
    public ResponseEntity<?> deleteGroup(@PathVariable Long id, jakarta.servlet.http.HttpServletRequest request) {
        return chatRepository.findById(id).map(chat -> {
            if (!"GROUP".equals(chat.getChatType().getName())) {
                return ResponseEntity.badRequest().build();
            }
            chatRepository.delete(chat);
            auditService.logAction(getCurrentUsername(), "DELETE_GROUP", "Deleted group: " + chat.getName(), request.getRemoteAddr());
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    public record GroupMemberDTO(Long userId, String username, String email, String role) {}

    @GetMapping("/groups/{id}/members")
    public ResponseEntity<List<GroupMemberDTO>> getGroupMembers(@PathVariable Long id) {
        return chatRepository.findById(id).map(chat -> {
            if (!"GROUP".equals(chat.getChatType().getName())) {
                return ResponseEntity.badRequest().<List<GroupMemberDTO>>build();
            }
            List<GroupMemberDTO> members = chatMemberRepository.findByChatId(id).stream()
                .map(cm -> new GroupMemberDTO(cm.getUser().getId(), cm.getUser().getUsername(), cm.getUser().getEmail(), cm.getIsAdmin() ? "ADMIN" : "MEMBER"))
                .toList();
            return ResponseEntity.ok(members);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/groups/{id}/members/{userId}/role")
    public ResponseEntity<?> updateGroupMemberRole(@PathVariable Long id, @PathVariable Long userId, @RequestBody java.util.Map<String, String> payload, jakarta.servlet.http.HttpServletRequest request) {
        return chatRepository.findById(id).map(chat -> {
            if (!"GROUP".equals(chat.getChatType().getName())) {
                return ResponseEntity.badRequest().build();
            }
            com.connecthub.connecthub.entity.ChatMember cm = chatMemberRepository.findByChatIdAndUserId(id, userId);
            if (cm == null) return ResponseEntity.notFound().build();
            
            cm.setIsAdmin("ADMIN".equals(payload.get("role")));
            chatMemberRepository.save(cm);
            
            auditService.logAction(getCurrentUsername(), "UPDATE_GROUP_MEMBER_ROLE", "Updated user " + cm.getUser().getUsername() + " to " + payload.get("role") + " in group " + chat.getName(), request.getRemoteAddr());
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/groups/{id}/members/{userId}")
    public ResponseEntity<?> removeGroupMember(@PathVariable Long id, @PathVariable Long userId, jakarta.servlet.http.HttpServletRequest request) {
        return chatRepository.findById(id).map(chat -> {
            if (!"GROUP".equals(chat.getChatType().getName())) {
                return ResponseEntity.badRequest().build();
            }
            com.connecthub.connecthub.entity.ChatMember cm = chatMemberRepository.findByChatIdAndUserId(id, userId);
            if (cm == null) return ResponseEntity.notFound().build();
            
            chatMemberRepository.delete(cm);
            
            auditService.logAction(getCurrentUsername(), "REMOVE_GROUP_MEMBER", "Removed user " + cm.getUser().getUsername() + " from group " + chat.getName(), request.getRemoteAddr());
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
