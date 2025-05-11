# Appointment Approval Workflow Test Plan

## Overview
This test plan verifies the complete appointment approval workflow, including notifications for both doctors and patients.

## Prerequisites
1. The application is running (both frontend and backend)
2. There are at least one doctor and one patient user in the system
3. You have login credentials for both a doctor and a patient account

## Test Cases

### Test Case 1: Patient Creates an Appointment Request
1. **Login as a patient**
   - Navigate to the login page
   - Enter patient credentials
   - Click "Login"

2. **Create a new appointment**
   - Navigate to the Appointments page
   - Click "New Appointment"
   - Fill in the appointment details:
     - Select a doctor
     - Enter a title
     - Enter a description
     - Select a date and time
     - Click "Create"
   - Verify that a success message is displayed
   - Verify that the appointment appears in the list with "Pending" status

3. **Verify the appointment details**
   - Click on the appointment in the list
   - Verify that the appointment details are displayed correctly
   - Verify that the status is "Pending"

4. **Logout**
   - Click the logout button

### Test Case 2: Doctor Receives a Notification
1. **Login as a doctor**
   - Navigate to the login page
   - Enter doctor credentials
   - Click "Login"

2. **Check notifications**
   - Verify that there is a notification badge in the top right corner
   - Click on the notification icon
   - Verify that there is a notification about a new appointment request
   - Verify that the notification contains:
     - The patient's name
     - The appointment date
     - The appointment title

3. **View the appointment**
   - Navigate to the Appointments page
   - Verify that the appointment appears in the list with "Pending" status
   - Verify that there are "Approve" and "Reject" buttons for the appointment

### Test Case 3: Doctor Approves the Appointment
1. **Approve the appointment**
   - Click the "Approve" button for the appointment
   - Verify that a success message is displayed
   - Verify that the appointment status changes to "Approved"

2. **Logout**
   - Click the logout button

### Test Case 4: Patient Receives Approval Notification
1. **Login as the patient**
   - Navigate to the login page
   - Enter patient credentials
   - Click "Login"

2. **Check notifications**
   - Verify that there is a notification badge in the top right corner
   - Click on the notification icon
   - Verify that there is a notification about the appointment being approved
   - Verify that the notification contains:
     - The doctor's name
     - The appointment date
     - A success message

3. **View the appointment**
   - Navigate to the Appointments page
   - Verify that the appointment appears in the list with "Approved" status

4. **Logout**
   - Click the logout button

### Test Case 5: Doctor Rejects an Appointment
1. **Login as a patient**
   - Create another appointment following the steps in Test Case 1

2. **Login as a doctor**
   - Navigate to the Appointments page
   - Find the new appointment with "Pending" status
   - Click the "Reject" button
   - Enter a reason for rejection (e.g., "Doctor unavailable on this date")
   - Click "Reject Appointment"
   - Verify that a success message is displayed
   - Verify that the appointment status changes to "Cancelled"

3. **Logout**
   - Click the logout button

### Test Case 6: Patient Receives Rejection Notification
1. **Login as the patient**
   - Navigate to the login page
   - Enter patient credentials
   - Click "Login"

2. **Check notifications**
   - Verify that there is a notification badge in the top right corner
   - Click on the notification icon
   - Verify that there is a notification about the appointment being rejected
   - Verify that the notification contains:
     - The doctor's name
     - The appointment date
     - The rejection reason

3. **View the appointment**
   - Navigate to the Appointments page
   - Verify that the appointment appears in the list with "Cancelled" status

## Expected Results
- Patients can create appointment requests
- Doctors receive notifications about new appointment requests
- Doctors can approve or reject appointment requests
- Patients receive notifications about appointment approvals or rejections
- The appointment status is updated correctly in the UI
- All notifications contain the relevant information

## Notes
- If any test fails, document the exact steps to reproduce the issue
- Include screenshots of any error messages
- Note any unexpected behavior
