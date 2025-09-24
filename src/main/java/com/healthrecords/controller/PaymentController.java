package com.healthrecords.controller;

import com.healthrecords.model.Appointment;
import com.healthrecords.model.User;
import com.healthrecords.service.PaymentService;
import com.healthrecords.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(originPatterns = {"http://localhost:*"}, allowCredentials = "false")
public class PaymentController {
    
    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);
    
    @Autowired
    private PaymentService paymentService;
    
    @Autowired
    private UserService userService;
    
    @PostMapping("/process")
    @PreAuthorize("hasRole('ROLE_PATIENT')")
    public ResponseEntity<?> processPayment(@RequestBody PaymentRequest request) {
        try {
            log.info("Processing payment request for appointment: {}", request.getAppointmentId());
            
            // Get current user from authentication context
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = auth.getName();
            User currentUser = userService.getUserByEmail(userEmail);
            Long userId = currentUser.getId();
            
            Appointment appointment = paymentService.processPayment(
                request.getAppointmentId(), 
                request.getAmount(), 
                request.getPaymentMethod(), 
                userId
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Payment processed successfully",
                "appointmentId", appointment.getId(),
                "paymentReference", appointment.getPaymentReference(),
                "paymentStatus", appointment.getPaymentStatus(),
                "paymentDate", appointment.getPaymentDate()
            ));
            
        } catch (Exception e) {
            log.error("Error processing payment: ", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Payment processing failed: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/history")
    @PreAuthorize("hasRole('ROLE_PATIENT')")
    public ResponseEntity<?> getPaymentHistory() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = auth.getName();
            User currentUser = userService.getUserByEmail(userEmail);
            Long userId = currentUser.getId();
            
            List<Appointment> paidAppointments = paymentService.getPaidAppointments(userId);
            
            return ResponseEntity.ok(paidAppointments);
            
        } catch (Exception e) {
            log.error("Error fetching payment history: ", e);
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to fetch payment history: " + e.getMessage()
            ));
        }
    }
    
    @PostMapping("/{appointmentId}/refund")
    @PreAuthorize("hasAnyRole('ROLE_PATIENT', 'ROLE_DOCTOR', 'ROLE_ADMIN')")
    public ResponseEntity<?> refundPayment(@PathVariable Long appointmentId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = auth.getName();
            User currentUser = userService.getUserByEmail(userEmail);
            Long userId = currentUser.getId();
            
            Appointment appointment = paymentService.refundPayment(appointmentId, userId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Payment refunded successfully",
                "appointmentId", appointment.getId(),
                "paymentStatus", appointment.getPaymentStatus()
            ));
            
        } catch (Exception e) {
            log.error("Error processing refund: ", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Refund processing failed: " + e.getMessage()
            ));
        }
    }
    
    // Request DTO class
    public static class PaymentRequest {
        private Long appointmentId;
        private BigDecimal amount;
        private String paymentMethod;
        
        // Constructors
        public PaymentRequest() {}
        
        public PaymentRequest(Long appointmentId, BigDecimal amount, String paymentMethod) {
            this.appointmentId = appointmentId;
            this.amount = amount;
            this.paymentMethod = paymentMethod;
        }
        
        // Getters and Setters
        public Long getAppointmentId() { return appointmentId; }
        public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }
        
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    }
}