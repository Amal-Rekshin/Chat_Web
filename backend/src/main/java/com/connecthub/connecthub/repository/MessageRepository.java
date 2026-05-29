package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByChatIdOrderByCreatedAtAsc(Long chatId);
    Long countByChatIdAndIdGreaterThan(Long chatId, Long lastReadMessageId);
    Message findFirstByChatIdOrderByCreatedAtDesc(Long chatId);
}
