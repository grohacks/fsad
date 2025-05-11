package com.healthrecords.repository;

import com.healthrecords.model.LabReport;
import com.healthrecords.model.MedicalRecord;
import com.healthrecords.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabReportRepository extends JpaRepository<LabReport, Long> {
    List<LabReport> findByMedicalRecord(MedicalRecord medicalRecord);

    List<LabReport> findByPatient(User patient);

    List<LabReport> findByDoctor(User doctor);

    List<LabReport> findByPatientAndDoctor(User patient, User doctor);
}
