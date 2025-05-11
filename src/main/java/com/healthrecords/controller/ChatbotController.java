package com.healthrecords.controller;

import com.healthrecords.dto.ChatMessageDTO;
import com.healthrecords.dto.ChatResponseDTO;
import com.healthrecords.model.ChatSession;
import com.healthrecords.model.User;
import com.healthrecords.service.ChatbotService;
import com.healthrecords.service.UserService;
import com.healthrecords.config.ChatbotConfig;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    @Autowired
    private ChatbotService chatbotService;

    @Autowired
    private UserService userService;

    @Autowired
    private ChatbotConfig chatbotConfig;

    /**
     * Create a new chat session
     */
    @PostMapping("/sessions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ChatSession> createChatSession() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();

        // Get user ID from email
        User user = userService.getUserByEmail(userEmail);
        Long userId = user.getId();

        System.out.println("Creating chat session for user: " + userEmail + " with ID: " + userId);

        ChatSession session = chatbotService.createChatSession(userId);
        return ResponseEntity.ok(session);
    }

    /**
     * Get all chat sessions for the current user
     */
    @GetMapping("/sessions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ChatSession>> getUserChatSessions() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();

        // Get user ID from email
        User user = userService.getUserByEmail(userEmail);
        Long userId = user.getId();

        System.out.println("Getting chat sessions for user: " + userEmail + " with ID: " + userId);

        List<ChatSession> sessions = chatbotService.getUserChatSessions(userId);
        return ResponseEntity.ok(sessions);
    }

    /**
     * Get a specific chat session with its messages
     */
    @GetMapping("/sessions/{sessionId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ChatSession> getChatSession(@PathVariable Long sessionId) {
        ChatSession session = chatbotService.getChatSessionWithMessages(sessionId);
        return ResponseEntity.ok(session);
    }

    /**
     * Send a message to the chatbot and get a response
     */
    @PostMapping("/sessions/{sessionId}/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ChatResponseDTO> sendMessage(
            @PathVariable Long sessionId,
            @RequestBody ChatMessageDTO messageDTO) {

        ChatResponseDTO response = chatbotService.processUserMessage(sessionId, messageDTO);
        return ResponseEntity.ok(response);
    }

    /**
     * Get chat history for a session
     */
    @GetMapping("/sessions/{sessionId}/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ChatMessageDTO>> getChatHistory(@PathVariable Long sessionId) {
        List<ChatMessageDTO> messages = chatbotService.getChatHistory(sessionId);
        return ResponseEntity.ok(messages);
    }

    /**
     * End a chat session
     */
    @PostMapping("/sessions/{sessionId}/end")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> endChatSession(@PathVariable Long sessionId) {
        chatbotService.endChatSession(sessionId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Chat session ended successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Get chatbot configuration including disclaimers and medical sources
     */
    @GetMapping("/config")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getChatbotConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("disclaimers", chatbotConfig.getDisclaimers());
        config.put("medicalSources", chatbotConfig.getMedicalSources());

        return ResponseEntity.ok(config);
    }
}
