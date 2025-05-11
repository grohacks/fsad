package com.healthrecords.dto;

import java.time.LocalDateTime;

public class ChatResponseDTO {
    private String response;
    private LocalDateTime timestamp;

    public ChatResponseDTO() {
    }

    public ChatResponseDTO(String response, LocalDateTime timestamp) {
        this.response = response;
        this.timestamp = timestamp;
    }

    public String getResponse() {
        return response;
    }

    public void setResponse(String response) {
        this.response = response;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
