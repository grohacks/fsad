package com.healthrecords.dto;

import com.healthrecords.model.User;
import com.healthrecords.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private UserRole role;
    private String phoneNumber;
    private String address;
    private String specialization;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static UserDTO fromUser(User user) {
        if (user == null) {
            System.out.println("Cannot create UserDTO from null User");
            return null;
        }

        System.out.println("Creating UserDTO from User: " + user.getId() +
            " - " + user.getFirstName() + " " + user.getLastName());

        UserDTO dto = UserDTO.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .specialization(user.getSpecialization())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();

        System.out.println("Created UserDTO: " + dto);
        return dto;
    }
}
