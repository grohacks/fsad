import React from "react";
import { Box, Container, Typography, Breadcrumbs, Link } from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";
import PrescriptionFormComponent from "../components/PrescriptionForm";

const PrescriptionForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 3, mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link component={RouterLink} to="/dashboard" color="inherit">
            Dashboard
          </Link>
          <Link component={RouterLink} to="/prescriptions" color="inherit">
            Prescriptions
          </Link>
          <Typography color="text.primary">
            {isEditMode ? "Edit Prescription" : "New Prescription"}
          </Typography>
        </Breadcrumbs>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom>
        {isEditMode ? "Edit Prescription" : "Create New Prescription"}
      </Typography>

      <PrescriptionFormComponent
        onSuccess={() => {
          window.location.href = "/prescriptions";
        }}
      />
    </Container>
  );
};

export default PrescriptionForm;
