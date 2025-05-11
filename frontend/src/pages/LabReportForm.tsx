import React, { useEffect } from 'react';
import { Grid, Box, Typography, Alert, CircularProgress } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useLabReports } from '../hooks/useLabReports';
import LabReportFormComponent from '../components/LabReportForm';
import { GradientTypography, StyledCard } from '../styles/shared';

const LabReportForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loading, error, getReportById, clearReport } = useLabReports();

  // Load data if editing an existing report
  useEffect(() => {
    if (id) {
      getReportById(parseInt(id));
    }

    return () => {
      clearReport();
    };
  }, [id, getReportById, clearReport]);

  const handleSuccess = () => {
    navigate('/lab-reports');
  };

  if (loading && id) {
    return (
      <Grid container justifyContent="center" alignItems="center" style={{ minHeight: '200px' }}>
        <CircularProgress />
      </Grid>
    );
  }

  if (error) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert severity="error">{error}</Alert>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <GradientTypography variant="h4">
          {id ? 'Edit Lab Report' : 'Create New Lab Report'}
        </GradientTypography>
      </Grid>
      <Grid item xs={12}>
        <LabReportFormComponent 
          labReportId={id ? parseInt(id) : undefined} 
          onSuccess={handleSuccess} 
        />
      </Grid>
    </Grid>
  );
};

export default LabReportForm;
