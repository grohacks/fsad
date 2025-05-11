package com.healthrecords.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.cache.annotation.Cacheable;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthrecords.config.ChatbotConfig;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

/**
 * Service for retrieving medical knowledge from external APIs
 */
@Service
public class MedicalKnowledgeService {

    @Autowired
    private RestTemplate restTemplate;
    
    @Autowired
    private ChatbotConfig chatbotConfig;
    
    @Value("${medical.api.medline.url}")
    private String medlineApiUrl;
    
    @Value("${medical.api.medline.key}")
    private String medlineApiKey;
    
    @Value("${medical.api.healthgov.url}")
    private String healthGovApiUrl;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Search for medical information across multiple sources
     */
    public Map<String, Object> searchMedicalInformation(String query) {
        Map<String, Object> results = new HashMap<>();
        
        try {
            // Search in parallel across multiple sources
            CompletableFuture<Map<String, Object>> medlineFuture = 
                CompletableFuture.supplyAsync(() -> searchMedlinePlus(query));
                
            CompletableFuture<Map<String, Object>> healthGovFuture = 
                CompletableFuture.supplyAsync(() -> searchHealthGov(query));
            
            // Wait for all searches to complete
            CompletableFuture.allOf(medlineFuture, healthGovFuture).join();
            
            // Combine results
            results.put("medlinePlus", medlineFuture.get());
            results.put("healthGov", healthGovFuture.get());
            results.put("sources", chatbotConfig.getMedicalSources());
            results.put("disclaimers", chatbotConfig.getDisclaimers());
            
        } catch (InterruptedException | ExecutionException e) {
            results.put("error", "Error searching medical information: " + e.getMessage());
        }
        
        return results;
    }
    
    /**
     * Search for medical conditions
     */
    @Cacheable(value = "medicalConditions", key = "#condition")
    public Map<String, Object> getMedicalConditionInfo(String condition) {
        Map<String, Object> results = new HashMap<>();
        
        try {
            // Search MedlinePlus for condition information
            Map<String, Object> medlineResults = searchMedlinePlus(condition);
            
            if (medlineResults.containsKey("results")) {
                results.put("information", medlineResults.get("results"));
                results.put("source", "MedlinePlus");
            } else {
                results.put("error", "No information found for condition: " + condition);
            }
            
        } catch (Exception e) {
            results.put("error", "Error retrieving condition information: " + e.getMessage());
        }
        
        return results;
    }
    
    /**
     * Get preventive measures for a health condition
     */
    @Cacheable(value = "preventiveMeasures", key = "#condition")
    public Map<String, Object> getPreventiveMeasures(String condition) {
        Map<String, Object> results = new HashMap<>();
        
        try {
            // Search Health.gov for preventive measures
            Map<String, Object> healthGovResults = searchHealthGov(condition + " prevention");
            
            if (healthGovResults.containsKey("results")) {
                results.put("preventiveMeasures", healthGovResults.get("results"));
                results.put("source", "Health.gov");
            } else {
                results.put("error", "No preventive measures found for: " + condition);
            }
            
        } catch (Exception e) {
            results.put("error", "Error retrieving preventive measures: " + e.getMessage());
        }
        
        return results;
    }
    
    /**
     * Search MedlinePlus API
     */
    private Map<String, Object> searchMedlinePlus(String query) {
        Map<String, Object> results = new HashMap<>();
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("API-Key", medlineApiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            String url = medlineApiUrl + "?query=" + query;
            
            ResponseEntity<String> response = 
                restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                JsonNode rootNode = objectMapper.readTree(response.getBody());
                
                List<Map<String, Object>> resultsList = new ArrayList<>();
                if (rootNode.has("result") && rootNode.get("result").isArray()) {
                    for (JsonNode resultNode : rootNode.get("result")) {
                        Map<String, Object> resultMap = new HashMap<>();
                        resultMap.put("title", resultNode.path("title").asText());
                        resultMap.put("summary", resultNode.path("snippet").asText());
                        resultMap.put("url", resultNode.path("url").asText());
                        resultsList.add(resultMap);
                    }
                }
                
                results.put("results", resultsList);
            } else {
                results.put("error", "Error from MedlinePlus API: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            results.put("error", "Error searching MedlinePlus: " + e.getMessage());
        }
        
        return results;
    }
    
    /**
     * Search Health.gov API
     */
    private Map<String, Object> searchHealthGov(String query) {
        Map<String, Object> results = new HashMap<>();
        
        try {
            String url = healthGovApiUrl + "?query=" + query;
            
            ResponseEntity<String> response = 
                restTemplate.exchange(url, HttpMethod.GET, null, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                JsonNode rootNode = objectMapper.readTree(response.getBody());
                
                List<Map<String, Object>> resultsList = new ArrayList<>();
                if (rootNode.has("items") && rootNode.get("items").isArray()) {
                    for (JsonNode itemNode : rootNode.get("items")) {
                        Map<String, Object> resultMap = new HashMap<>();
                        resultMap.put("title", itemNode.path("title").asText());
                        resultMap.put("description", itemNode.path("description").asText());
                        resultMap.put("url", itemNode.path("url").asText());
                        resultsList.add(resultMap);
                    }
                }
                
                results.put("results", resultsList);
            } else {
                results.put("error", "Error from Health.gov API: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            results.put("error", "Error searching Health.gov: " + e.getMessage());
        }
        
        return results;
    }
}
