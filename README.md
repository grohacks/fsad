# Health Records System

A comprehensive health records management system built with Spring Boot and React.

## Features

- User Authentication and Authorization
- Medical Records Management
- Lab Reports Upload/Download
- Prescription Management
- File Upload/Download
- Email Notifications
- Role-based Access Control

## Tech Stack

### Backend
- Spring Boot 3.2.3
- Spring Security with JWT
- Spring Data JPA
- MySQL Database
- Spring Mail

### Frontend
- React 18
- TypeScript
- Material-UI
- Redux Toolkit
- React Router
- Axios
- Formik & Yup

## Prerequisites

- Java 17 or higher
- Node.js 16 or higher
- MySQL 8.0 or higher
- Maven

## Setup Instructions

### Backend Setup

1. Clone the repository
2. Configure MySQL database:
   - Create a database named `health_records_db`
   - Update `application.properties` with your database credentials

3. Configure email settings in `application.properties`:
   ```properties
   spring.mail.username=your-email@gmail.com
   spring.mail.password=your-app-specific-password
   ```

4. Build and run the backend:
   ```bash
   cd backend
   mvn clean install
   mvn spring-boot:run
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user

### Medical Records
- GET `/api/medical-records` - Get all medical records
- GET `/api/medical-records/{id}` - Get medical record by ID
- POST `/api/medical-records` - Create new medical record
- PUT `/api/medical-records/{id}` - Update medical record
- DELETE `/api/medical-records/{id}` - Delete medical record

### Lab Reports
- GET `/api/lab-reports` - Get all lab reports
- GET `/api/lab-reports/{id}` - Get lab report by ID
- POST `/api/lab-reports/upload` - Upload lab report
- GET `/api/lab-reports/{id}/download` - Download lab report

### Prescriptions
- GET `/api/prescriptions` - Get all prescriptions
- GET `/api/prescriptions/{id}` - Get prescription by ID
- POST `/api/prescriptions` - Create new prescription
- PUT `/api/prescriptions/{id}` - Update prescription
- DELETE `/api/prescriptions/{id}` - Delete prescription

## Security

- JWT-based authentication
- Role-based access control
- Password encryption
- Secure file upload/download
- CORS configuration

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. #   f s a d  
 