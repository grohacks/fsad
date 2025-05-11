package com.healthrecords.repository;

import com.healthrecords.model.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    
    List<ChatSession> findByUserId(Long userId);
    
    List<ChatSession> findByUserIdAndIsActiveTrue(Long userId);
}
