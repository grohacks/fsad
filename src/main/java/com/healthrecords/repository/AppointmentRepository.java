package com.healthrecords.repository;

import com.healthrecords.model.Appointment;
import com.healthrecords.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    
    List<Appointment> findByPatient(User patient);
    
    List<Appointment> findByDoctor(User doctor);
    
    List<Appointment> findByPatientAndStatus(User patient, Appointment.AppointmentStatus status);
    
    List<Appointment> findByDoctorAndStatus(User doctor, Appointment.AppointmentStatus status);
    
    @Query("SELECT a FROM Appointment a WHERE a.doctor = ?1 AND a.appointmentDateTime BETWEEN ?2 AND ?3")
    List<Appointment> findByDoctorAndDateRange(User doctor, LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT a FROM Appointment a WHERE a.patient = ?1 AND a.appointmentDateTime BETWEEN ?2 AND ?3")
    List<Appointment> findByPatientAndDateRange(User patient, LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT a FROM Appointment a WHERE a.appointmentDateTime BETWEEN ?1 AND ?2")
    List<Appointment> findByDateRange(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT a FROM Appointment a WHERE a.appointmentDateTime > ?1 AND a.status = ?2")
    List<Appointment> findUpcomingAppointmentsByStatus(LocalDateTime now, Appointment.AppointmentStatus status);
    
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctor = ?1 AND a.appointmentDateTime BETWEEN ?2 AND ?3")
    Long countAppointmentsByDoctorAndDateRange(User doctor, LocalDateTime start, LocalDateTime end);
}
