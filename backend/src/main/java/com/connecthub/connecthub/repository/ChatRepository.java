package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.entity.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Long> {

    @Query("SELECT COUNT(c) FROM Chat c WHERE c.chatType.name = :type")
    long countByType(@Param("type") String type);
    
    @Query("SELECT c FROM Chat c WHERE c.chatType.name = :type")
    List<Chat> findByType(@Param("type") String type);

    @Query("SELECT c FROM Chat c JOIN ChatMember cm ON c.id = cm.chat.id WHERE cm.user.id = :userId")
    List<Chat> findChatsByUserId(@Param("userId") Long userId);

    @Query("SELECT c FROM Chat c JOIN ChatMember cm1 ON c.id = cm1.chat.id JOIN ChatMember cm2 ON c.id = cm2.chat.id WHERE c.chatType.name = 'PRIVATE' AND cm1.user.id = :user1Id AND cm2.user.id = :user2Id")
    List<Chat> findPrivateChatBetweenUsers(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);

    @Query("SELECT COUNT(c) > 0 FROM Chat c JOIN ChatMember cm1 ON c.id = cm1.chat.id JOIN ChatMember cm2 ON c.id = cm2.chat.id WHERE c.chatType.name = 'GROUP' AND cm1.user.id = :user1Id AND cm2.user.id = :user2Id")
    boolean hasMutualGroup(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);
}
