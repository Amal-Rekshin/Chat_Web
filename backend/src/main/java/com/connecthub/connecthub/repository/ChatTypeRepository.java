package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.entity.ChatType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ChatTypeRepository extends JpaRepository<ChatType, Long> {
    Optional<ChatType> findByName(String name);
}
