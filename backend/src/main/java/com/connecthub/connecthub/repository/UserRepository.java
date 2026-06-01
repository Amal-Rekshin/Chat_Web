package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT u FROM User u JOIN ChatMember cm1 ON u.id = cm1.user.id JOIN ChatMember cm2 ON cm1.chat.id = cm2.chat.id WHERE cm2.user.id = :userId AND cm1.chat.chatType.name = 'GROUP' AND u.id != :userId AND cm1.isAdmin = false AND cm2.isAdmin = false")
    java.util.List<User> findMutualGroupMembers(@org.springframework.data.repository.query.Param("userId") Long userId);

    java.util.List<User> findByRole(com.connecthub.connecthub.entity.Role role);
    
    @org.springframework.data.jpa.repository.Query(value = "SELECT CAST(created_at AS DATE) as date, COUNT(*) as count FROM users WHERE created_at >= CURRENT_DATE - INTERVAL 6 DAY GROUP BY CAST(created_at AS DATE) ORDER BY date ASC", nativeQuery = true)
    java.util.List<Object[]> countUsersCreatedPerDayLast7Days();
}
