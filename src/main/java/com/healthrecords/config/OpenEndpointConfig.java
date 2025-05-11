package com.healthrecords.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * Configuration for open endpoints
 * This configuration allows CORS for open endpoints
 */
@Configuration
public class OpenEndpointConfig {

    /**
     * CORS filter for open endpoints
     */
    @Bean
    public CorsFilter openEndpointCorsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        // Allow all origins, headers, and methods
        config.addAllowedOrigin("*");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        
        // Apply this configuration to open endpoints
        source.registerCorsConfiguration("/api/open/**", config);
        
        return new CorsFilter(source);
    }
}
