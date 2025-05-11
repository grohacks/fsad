package com.healthrecords.service;

import com.healthrecords.model.MedicalRecord;
import com.healthrecords.model.User;
import com.healthrecords.model.UserRole;
import com.healthrecords.repository.MedicalRecordRepository;
import com.healthrecords.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MedicalRecordServiceTest {

    @Mock
    private MedicalRecordRepository medicalRecordRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private MedicalRecordService medicalRecordService;

    private User patient;
    private User doctor;
    private MedicalRecord medicalRecord;

    @BeforeEach
    void setUp() {
        // Create test users
        patient = new User();
        patient.setId(1L);
        patient.setFirstName("John");
        patient.setLastName("Doe");
        patient.setEmail("patient@example.com");
        patient.setRole(UserRole.ROLE_PATIENT);

        doctor = new User();
        doctor.setId(2L);
        doctor.setFirstName("Jane");
        doctor.setLastName("Smith");
        doctor.setEmail("doctor@example.com");
        doctor.setRole(UserRole.ROLE_DOCTOR);

        // Create test medical record
        medicalRecord = new MedicalRecord();
        medicalRecord.setId(1L);
        medicalRecord.setPatient(patient);
        medicalRecord.setDoctor(doctor);
        medicalRecord.setDiagnosis("Test Diagnosis");
        medicalRecord.setTreatment("Test Treatment");
        medicalRecord.setNotes("Test Notes");
        medicalRecord.setCreatedAt(LocalDateTime.now());
        medicalRecord.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    void getAllMedicalRecords_ShouldReturnAllRecords() {
        // Arrange
        List<MedicalRecord> expectedRecords = Arrays.asList(medicalRecord);
        when(medicalRecordRepository.findAll()).thenReturn(expectedRecords);

        // Act
        List<MedicalRecord> actualRecords = medicalRecordService.getAllMedicalRecords();

        // Assert
        assertEquals(expectedRecords.size(), actualRecords.size());
        assertEquals(expectedRecords.get(0).getId(), actualRecords.get(0).getId());
        verify(medicalRecordRepository, times(1)).findAll();
    }

    @Test
    void getMedicalRecordById_WithValidId_ShouldReturnRecord() {
        // Arrange
        when(medicalRecordRepository.findById(1L)).thenReturn(Optional.of(medicalRecord));

        // Act
        MedicalRecord actualRecord = medicalRecordService.getMedicalRecordById(1L);

        // Assert
        assertNotNull(actualRecord);
        assertEquals(medicalRecord.getId(), actualRecord.getId());
        assertEquals(medicalRecord.getDiagnosis(), actualRecord.getDiagnosis());
        verify(medicalRecordRepository, times(1)).findById(1L);
    }

    @Test
    void getMedicalRecordById_WithInvalidId_ShouldThrowException() {
        // Arrange
        when(medicalRecordRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () -> {
            medicalRecordService.getMedicalRecordById(999L);
        });
        verify(medicalRecordRepository, times(1)).findById(999L);
    }

    @Test
    void createMedicalRecord_WithValidData_ShouldCreateRecord() {
        // Arrange
        when(userRepository.findById(patient.getId())).thenReturn(Optional.of(patient));
        when(userRepository.findById(doctor.getId())).thenReturn(Optional.of(doctor));
        when(medicalRecordRepository.save(any(MedicalRecord.class))).thenReturn(medicalRecord);

        // Act
        MedicalRecord actualRecord = medicalRecordService.createMedicalRecord(medicalRecord);

        // Assert
        assertNotNull(actualRecord);
        assertEquals(medicalRecord.getId(), actualRecord.getId());
        assertEquals(medicalRecord.getDiagnosis(), actualRecord.getDiagnosis());
        verify(medicalRecordRepository, times(1)).save(any(MedicalRecord.class));
    }

    @Test
    void updateMedicalRecord_WithValidData_ShouldUpdateRecord() {
        // Arrange
        MedicalRecord updatedRecord = new MedicalRecord();
        updatedRecord.setId(1L);
        updatedRecord.setPatient(patient);
        updatedRecord.setDoctor(doctor);
        updatedRecord.setDiagnosis("Updated Diagnosis");
        updatedRecord.setTreatment("Updated Treatment");
        updatedRecord.setNotes("Updated Notes");

        when(medicalRecordRepository.findById(1L)).thenReturn(Optional.of(medicalRecord));
        when(userRepository.findById(patient.getId())).thenReturn(Optional.of(patient));
        when(userRepository.findById(doctor.getId())).thenReturn(Optional.of(doctor));
        when(medicalRecordRepository.save(any(MedicalRecord.class))).thenReturn(updatedRecord);

        // Act
        MedicalRecord actualRecord = medicalRecordService.updateMedicalRecord(1L, updatedRecord);

        // Assert
        assertNotNull(actualRecord);
        assertEquals(updatedRecord.getDiagnosis(), actualRecord.getDiagnosis());
        assertEquals(updatedRecord.getTreatment(), actualRecord.getTreatment());
        verify(medicalRecordRepository, times(1)).findById(1L);
        verify(medicalRecordRepository, times(1)).save(any(MedicalRecord.class));
    }

    @Test
    void deleteMedicalRecord_WithValidId_ShouldDeleteRecord() {
        // Arrange
        when(medicalRecordRepository.existsById(1L)).thenReturn(true);
        doNothing().when(medicalRecordRepository).deleteById(1L);

        // Act
        medicalRecordService.deleteMedicalRecord(1L);

        // Assert
        verify(medicalRecordRepository, times(1)).existsById(1L);
        verify(medicalRecordRepository, times(1)).deleteById(1L);
    }

    @Test
    void deleteMedicalRecord_WithInvalidId_ShouldThrowException() {
        // Arrange
        when(medicalRecordRepository.existsById(999L)).thenReturn(false);

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () -> {
            medicalRecordService.deleteMedicalRecord(999L);
        });
        verify(medicalRecordRepository, times(1)).existsById(999L);
        verify(medicalRecordRepository, never()).deleteById(any());
    }
}
