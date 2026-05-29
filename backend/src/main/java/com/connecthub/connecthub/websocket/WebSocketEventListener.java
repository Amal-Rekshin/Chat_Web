package com.connecthub.connecthub.websocket;

import com.connecthub.connecthub.entity.User;
import com.connecthub.connecthub.repository.UserRepository;
import com.connecthub.connecthub.repository.UserStatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final UserRepository userRepository;
    private final UserStatusRepository userStatusRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final com.connecthub.connecthub.service.AdminStatsService adminStatsService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        System.out.println("WEBSOCKET CONNECTED EVENT: " + accessor.getSessionId());
        if (accessor.getUser() != null) {
            String username = accessor.getUser().getName();
            System.out.println("USER CONNECTED: " + username);
            userRepository.findByUsername(username).ifPresent(user -> {
                user.setStatus(userStatusRepository.findByName("ONLINE").orElseThrow());
                userRepository.save(user);
                
                // Broadcast status
                messagingTemplate.convertAndSend("/topic/status", 
                    new StatusUpdatePayload(user.getId(), user.getUsername(), "ONLINE", null));
                
                adminStatsService.broadcastStats();
            });
        } else {
            System.out.println("USER IS NULL ON CONNECT EVENT");
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        System.out.println("WEBSOCKET DISCONNECT EVENT: " + accessor.getSessionId());
        if (accessor.getUser() != null) {
            String username = accessor.getUser().getName();
            System.out.println("USER DISCONNECTED: " + username);
            userRepository.findByUsername(username).ifPresent(user -> {
                user.setStatus(userStatusRepository.findByName("OFFLINE").orElseThrow());
                user.setLastSeen(LocalDateTime.now());
                userRepository.save(user);
                
                // Broadcast status
                messagingTemplate.convertAndSend("/topic/status", 
                    new StatusUpdatePayload(user.getId(), user.getUsername(), "OFFLINE", user.getLastSeen()));

                adminStatsService.broadcastStats();
            });
        } else {
            System.out.println("USER IS NULL ON DISCONNECT EVENT");
        }
    }

    public record StatusUpdatePayload(Long userId, String username, String status, LocalDateTime lastSeen) {}
}
