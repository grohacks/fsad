package com.healthrecords.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Primary CORS configuration for the application
 * This configuration takes precedence over other CORS configurations
 */
@Configuration
public class WebConfig {

    @Bean
    @Primary
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // Configure CORS for all endpoints
                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:5173", "https://health-records-app.vercel.app", "https://health-records-app.netlify.app")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("Authorization", "Content-Type", "X-Requested-With")
                        .allowCredentials(true)
                        .maxAge(3600);

                System.out.println("CORS configured for all endpoints in WebConfig (Primary Configuration)");
            }
        };
    }
}
