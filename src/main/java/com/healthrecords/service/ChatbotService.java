package com.healthrecords.service;

import com.healthrecords.dto.ChatMessageDTO;
import com.healthrecords.dto.ChatResponseDTO;
import com.healthrecords.model.ChatSession;
import com.healthrecords.model.ChatMessage;
import com.healthrecords.model.User;
import com.healthrecords.repository.ChatSessionRepository;
import com.healthrecords.repository.ChatMessageRepository;
import com.healthrecords.repository.UserRepository;
import com.healthrecords.exception.EntityNotFoundException;
import com.healthrecords.config.ChatbotConfig;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import java.util.Optional;

@Service
public class ChatbotService {

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ChatbotConfig chatbotConfig;

    @Autowired
    private MedicalKnowledgeService medicalKnowledgeService;

    @Value("${chatbot.api.url}")
    private String chatbotApiUrl;

    @Value("${chatbot.api.key}")
    private String chatbotApiKey;

    /**
     * Create a new chat session for a user
     */
    @Transactional
    public ChatSession createChatSession(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        ChatSession chatSession = new ChatSession();
        chatSession.setUser(user);
        chatSession.setStartTime(LocalDateTime.now());
        chatSession.setActive(true);

        return chatSessionRepository.save(chatSession);
    }

    /**
     * Get all chat sessions for a user
     */
    public List<ChatSession> getUserChatSessions(Long userId) {
        return chatSessionRepository.findByUserId(userId);
    }

    /**
     * Get a specific chat session with its messages
     */
    public ChatSession getChatSessionWithMessages(Long sessionId) {
        return chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Chat session not found"));
    }

    /**
     * Process a user message and get a response from the chatbot
     */
    @Transactional
    public ChatResponseDTO processUserMessage(Long sessionId, ChatMessageDTO messageDTO) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Chat session not found"));

        // Save user message
        ChatMessage userMessage = new ChatMessage();
        userMessage.setChatSession(session);
        userMessage.setContent(messageDTO.getContent());
        userMessage.setSender("USER");
        userMessage.setTimestamp(LocalDateTime.now());
        chatMessageRepository.save(userMessage);

        // Get response from external API or knowledge base
        String botResponse = getBotResponse(messageDTO.getContent(), session.getId());

        // Save bot response
        ChatMessage botMessage = new ChatMessage();
        botMessage.setChatSession(session);
        botMessage.setContent(botResponse);
        botMessage.setSender("BOT");
        botMessage.setTimestamp(LocalDateTime.now());
        chatMessageRepository.save(botMessage);

        // Update session last activity time
        session.setLastActivityTime(LocalDateTime.now());
        chatSessionRepository.save(session);

        return new ChatResponseDTO(botResponse, botMessage.getTimestamp());
    }

    /**
     * Get a response from the external chatbot API or internal knowledge base
     */
    private String getBotResponse(String userMessage, Long sessionId) {
        try {
            // Check if the message is a medical query
            if (isMedicalQuery(userMessage)) {
                // Use the medical knowledge service to get information
                Map<String, Object> medicalInfo = medicalKnowledgeService.searchMedicalInformation(userMessage);

                // Format the response
                return formatMedicalResponse(medicalInfo, userMessage);
            } else {
                // For non-medical queries, use the external chatbot API
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("Authorization", "Bearer " + chatbotApiKey);

                // Prepare request body
                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("message", userMessage);
                requestBody.put("session_id", sessionId.toString());

                // Add medical context flag
                requestBody.put("context", "medical");

                // Add disclaimer flag
                requestBody.put("include_disclaimer", true);

                HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

                // Make API call
                @SuppressWarnings("unchecked")
                Map<String, Object> response = restTemplate.postForObject(
                        chatbotApiUrl,
                        request,
                        Map.class
                );

                if (response != null && response.containsKey("response")) {
                    return (String) response.get("response");
                } else {
                    return "I'm sorry, I couldn't process your request at this time. Please try again later.";
                }
            }
        } catch (Exception e) {
            // Log the error
            System.err.println("Error getting bot response: " + e.getMessage());

            // Return a fallback response
            return "I'm sorry, I'm having trouble connecting to my knowledge base. Please try again later or contact support if the problem persists.";
        }
    }

    /**
     * Check if the user message is a medical query
     */
    private boolean isMedicalQuery(String message) {
        // List of medical keywords to check
        String[] medicalKeywords = {
            "symptom", "disease", "condition", "treatment", "medicine", "diagnosis",
            "health", "medical", "doctor", "hospital", "clinic", "prescription",
            "pain", "fever", "cough", "headache", "allergy", "infection",
            "diabetes", "cancer", "heart", "blood", "pressure", "cholesterol",
            "vaccine", "prevention", "diet", "exercise", "nutrition"
        };

        String lowerMessage = message.toLowerCase();

        // Check if the message contains any medical keywords
        for (String keyword : medicalKeywords) {
            if (lowerMessage.contains(keyword)) {
                return true;
            }
        }

        // Check if the message is a question about health
        return lowerMessage.contains("what is") &&
               (lowerMessage.contains("health") || lowerMessage.contains("medical"));
    }

    /**
     * Format the medical information into a readable response
     */
    private String formatMedicalResponse(Map<String, Object> medicalInfo, String query) {
        StringBuilder response = new StringBuilder();

        // Check if there was an error
        if (medicalInfo.containsKey("error")) {
            return "I'm sorry, I couldn't find reliable information about that. " +
                   "Please consult with a healthcare professional for accurate advice.";
        }

        // Add introduction
        response.append("Here's what I found about \"").append(query).append("\":\n\n");

        // Add MedlinePlus information if available
        @SuppressWarnings("unchecked")
        Map<String, Object> medlinePlus = (Map<String, Object>) medicalInfo.get("medlinePlus");
        if (medlinePlus != null && medlinePlus.containsKey("results")) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> results = (List<Map<String, Object>>) medlinePlus.get("results");

            if (!results.isEmpty()) {
                Map<String, Object> topResult = results.get(0);
                response.append("From MedlinePlus: ").append(topResult.get("title")).append("\n");
                response.append(topResult.get("summary")).append("\n\n");

                if (results.size() > 1) {
                    response.append("Additional information:\n");
                    for (int i = 1; i < Math.min(3, results.size()); i++) {
                        response.append("- ").append(results.get(i).get("title")).append("\n");
                    }
                    response.append("\n");
                }
            }
        }

        // Add Health.gov information if available
        @SuppressWarnings("unchecked")
        Map<String, Object> healthGov = (Map<String, Object>) medicalInfo.get("healthGov");
        if (healthGov != null && healthGov.containsKey("results")) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> results = (List<Map<String, Object>>) healthGov.get("results");

            if (!results.isEmpty()) {
                Map<String, Object> topResult = results.get(0);
                response.append("From Health.gov: ").append(topResult.get("title")).append("\n");
                response.append(topResult.get("description")).append("\n\n");
            }
        }

        // Add disclaimer
        response.append("DISCLAIMER: This information is for educational purposes only and is not a substitute for professional medical advice. ");
        response.append("Always consult with a qualified healthcare provider for medical advice, diagnosis, or treatment.");

        return response.toString();
    }

    /**
     * End a chat session
     */
    @Transactional
    public void endChatSession(Long sessionId) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Chat session not found"));

        session.setActive(false);
        session.setEndTime(LocalDateTime.now());
        chatSessionRepository.save(session);
    }

    /**
     * Get chat history for a session
     */
    public List<ChatMessageDTO> getChatHistory(Long sessionId) {
        List<ChatMessage> messages = chatMessageRepository.findByChatSessionIdOrderByTimestampAsc(sessionId);

        return messages.stream()
                .map(message -> new ChatMessageDTO(
                        message.getId(),
                        message.getContent(),
                        message.getSender(),
                        message.getTimestamp()))
                .collect(Collectors.toList());
    }
}
