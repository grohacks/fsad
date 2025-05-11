package com.healthrecords.service;

import com.healthrecords.model.MedicalRecord;
import com.healthrecords.model.Prescription;
import com.healthrecords.repository.MedicalRecordRepository;
import com.healthrecords.repository.PrescriptionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final MedicalRecordRepository medicalRecordRepository;

    public List<Prescription> getAllPrescriptions() {
        return prescriptionRepository.findAll();
    }

    public Prescription getPrescriptionById(Long id) {
        return prescriptionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Prescription not found with id: " + id));
    }

    public Prescription createPrescription(Prescription prescription) {
        validateMedicalRecord(prescription);
        return prescriptionRepository.save(prescription);
    }

    public Prescription updatePrescription(Long id, Prescription prescription) {
        if (!prescriptionRepository.existsById(id)) {
            throw new EntityNotFoundException("Prescription not found with id: " + id);
        }
        validateMedicalRecord(prescription);
        prescription.setId(id);
        return prescriptionRepository.save(prescription);
    }

    public void deletePrescription(Long id) {
        if (!prescriptionRepository.existsById(id)) {
            throw new EntityNotFoundException("Prescription not found with id: " + id);
        }
        prescriptionRepository.deleteById(id);
    }

    private void validateMedicalRecord(Prescription prescription) {
        if (prescription.getMedicalRecord() != null && prescription.getMedicalRecord().getId() != null) {
            MedicalRecord medicalRecord = medicalRecordRepository.findById(prescription.getMedicalRecord().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Medical record not found"));
            prescription.setMedicalRecord(medicalRecord);
        }
    }
}
