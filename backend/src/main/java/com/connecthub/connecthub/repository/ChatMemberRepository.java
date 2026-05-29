package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.entity.ChatMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMemberRepository extends JpaRepository<ChatMember, Long> {
    List<ChatMember> findByChatId(Long chatId);
    ChatMember findByChatIdAndUserId(Long chatId, Long userId);
    List<ChatMember> findByUserId(Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT cm.user.username FROM ChatMember cm WHERE cm.chat.id = :chatId AND cm.user.id != :userId")
    String findOtherMemberUsername(@org.springframework.data.repository.query.Param("chatId") Long chatId, @org.springframework.data.repository.query.Param("userId") Long userId);
}
