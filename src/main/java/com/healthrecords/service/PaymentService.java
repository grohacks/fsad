package com.healthrecords.service;

import com.healthrecords.model.Appointment;
import com.healthrecords.repository.AppointmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class PaymentService {
    
    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);
    
    @Autowired
    private AppointmentRepository appointmentRepository;
    
    public Appointment processPayment(Long appointmentId, BigDecimal amount, String paymentMethod, Long userId) {
        log.info("Processing payment for appointment: {} by user: {}", appointmentId, userId);
        
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        // Verify user is the patient of this appointment
        if (!appointment.getPatient().getId().equals(userId)) {
            throw new RuntimeException("You can only pay for your own appointments");
        }
        
        // Simulate payment processing (90% success rate)
        boolean paymentSuccess = Math.random() > 0.1;
        
        if (paymentSuccess) {
            appointment.setPaymentAmount(amount);
            appointment.setPaymentStatus(Appointment.PaymentStatus.PAID);
            appointment.setPaymentMethod(paymentMethod);
            appointment.setPaymentDate(LocalDateTime.now());
            appointment.setPaymentReference("PAY_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            appointment.setPaymentNotes("Payment processed successfully");
            
            log.info("Payment successful for appointment: {}", appointmentId);
        } else {
            appointment.setPaymentStatus(Appointment.PaymentStatus.UNPAID);
            appointment.setPaymentNotes("Payment failed - please try again");
            log.warn("Payment failed for appointment: {}", appointmentId);
            throw new RuntimeException("Payment processing failed - please try again");
        }
        
        return appointmentRepository.save(appointment);
    }
    
    public List<Appointment> getPaidAppointments(Long userId) {
        return appointmentRepository.findByPatientIdAndPaymentStatus(userId, Appointment.PaymentStatus.PAID);
    }
    
    public List<Appointment> getUnpaidAppointments(Long userId) {
        return appointmentRepository.findByPatientIdAndPaymentStatus(userId, Appointment.PaymentStatus.UNPAID);
    }
    
    public Appointment refundPayment(Long appointmentId, Long userId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        // Check if user has access (patient or doctor)
        if (!appointment.getPatient().getId().equals(userId) && 
            !appointment.getDoctor().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        if (appointment.getPaymentStatus() != Appointment.PaymentStatus.PAID) {
            throw new RuntimeException("Only paid appointments can be refunded");
        }
        
        appointment.setPaymentStatus(Appointment.PaymentStatus.REFUNDED);
        appointment.setPaymentNotes("Payment refunded");
        
        return appointmentRepository.save(appointment);
    }
}