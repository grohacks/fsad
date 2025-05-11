package com.healthrecords.repository;

import com.healthrecords.model.MedicalRecord;
import com.healthrecords.model.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByMedicalRecord(MedicalRecord medicalRecord);
}
