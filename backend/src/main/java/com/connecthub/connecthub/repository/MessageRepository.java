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
    
    @org.springframework.data.jpa.repository.Query(value = "SELECT CAST(created_at AS DATE) as date, COUNT(*) as count FROM messages WHERE created_at >= CURRENT_DATE - INTERVAL 6 DAY GROUP BY CAST(created_at AS DATE) ORDER BY date ASC", nativeQuery = true)
    List<Object[]> countMessagesPerDayLast7Days();
}
