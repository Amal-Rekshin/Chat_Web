package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.entity.MessageType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MessageTypeRepository extends JpaRepository<MessageType, Long> {
    Optional<MessageType> findByName(String name);
}
