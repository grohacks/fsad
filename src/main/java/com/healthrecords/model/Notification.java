package com.healthrecords.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "notifications")
@EntityListeners(AuditingEntityListener.class)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false, length = 100)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String message;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;
    
    @Column(nullable = false)
    private Boolean isRead;
    
    @ManyToOne
    @JoinColumn(name = "related_entity_id")
    private Appointment relatedAppointment;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    public enum NotificationType {
        APPOINTMENT_REQUESTED,
        APPOINTMENT_CONFIRMED,
        APPOINTMENT_REJECTED,
        APPOINTMENT_CANCELLED,
        APPOINTMENT_REMINDER,
        SYSTEM
    }
}
