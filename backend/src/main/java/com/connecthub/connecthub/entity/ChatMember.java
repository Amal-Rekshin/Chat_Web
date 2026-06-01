package com.connecthub.connecthub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_members", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"chat_id", "user_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id", nullable = false)
    private Chat chat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Builder.Default
    @Column(name = "is_admin")
    private Boolean isAdmin = false;

    @Builder.Default
    @Column(name = "is_muted")
    private Boolean isMuted = false;

    @Column(name = "encrypted_chat_key", columnDefinition = "TEXT")
    private String encryptedChatKey;

    @Column(name = "joined_at", updatable = false)
    private LocalDateTime joinedAt;

    @Column(name = "last_read_id")
    private Long lastReadId;

    @Column(name = "last_delivered_id")
    private Long lastDeliveredId;

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
    }
}
