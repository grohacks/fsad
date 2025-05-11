package com.healthrecords.controller;

import com.healthrecords.model.User;
import com.healthrecords.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicApiController {

    private final UserService userService;

    @GetMapping("/doctors")
    public ResponseEntity<List<User>> getAllDoctors() {
        System.out.println("==== Received request to get doctors from public endpoint ====");
        try {
            // Log request details
            System.out.println("This endpoint is public and should be accessible without authentication");

            // Get all doctors
            List<User> doctors = userService.getAllDoctors();
            System.out.println("Found " + doctors.size() + " doctors in public endpoint");

            // Return the doctors (CORS headers are added by the @CrossOrigin annotation)
            return ResponseEntity.ok(doctors);
        } catch (Exception e) {
            System.out.println("Error in public getAllDoctors: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}
