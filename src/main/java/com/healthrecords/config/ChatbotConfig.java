package com.healthrecords.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import java.time.Duration;
import java.util.List;
import java.util.ArrayList;

@Configuration
@EnableConfigurationProperties
@ConfigurationProperties(prefix = "chatbot")
public class ChatbotConfig {
    
    private String apiUrl;
    private String apiKey;
    private int timeoutSeconds = 10;
    private List<String> disclaimers = new ArrayList<>();
    private List<String> medicalSources = new ArrayList<>();
    
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(timeoutSeconds))
                .setReadTimeout(Duration.ofSeconds(timeoutSeconds))
                .build();
    }

    public String getApiUrl() {
        return apiUrl;
    }

    public void setApiUrl(String apiUrl) {
        this.apiUrl = apiUrl;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public int getTimeoutSeconds() {
        return timeoutSeconds;
    }

    public void setTimeoutSeconds(int timeoutSeconds) {
        this.timeoutSeconds = timeoutSeconds;
    }

    public List<String> getDisclaimers() {
        return disclaimers;
    }

    public void setDisclaimers(List<String> disclaimers) {
        this.disclaimers = disclaimers;
    }

    public List<String> getMedicalSources() {
        return medicalSources;
    }

    public void setMedicalSources(List<String> medicalSources) {
        this.medicalSources = medicalSources;
    }
}
