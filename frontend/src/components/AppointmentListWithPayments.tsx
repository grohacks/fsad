import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { format } from 'date-fns';
import { Appointment } from '../types';
import { PaymentButton } from './PaymentButton';
import { appointmentApi } from '../services/api';

export const AppointmentListWithPayments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentApi.getMyAppointments();
      setAppointments(response.data);
    } catch (err: any) {
      console.error('Failed to fetch appointments:', err);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Refresh appointments to show updated payment status
    fetchAppointments();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'APPROVED':
        return 'info';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPp');
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Appointments
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {appointments.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              No appointments found.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {appointments.map((appointment) => (
            <Grid item xs={12} md={6} lg={4} key={appointment.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="h3">
                      {appointment.title}
                    </Typography>
                    <Chip
                      label={appointment.status}
                      color={getStatusColor(appointment.status)}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Date:</strong> {formatDate(appointment.appointmentDateTime)}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Doctor:</strong>{' '}
                    {typeof appointment.doctor === 'object'
                      ? `${appointment.doctor.firstName} ${appointment.doctor.lastName}`
                      : 'Unknown Doctor'}
                  </Typography>

                  {appointment.description && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Description:</strong> {appointment.description}
                    </Typography>
                  )}

                  {appointment.isVideoConsultation && (
                    <Chip
                      label="Video Consultation"
                      color="primary"
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  )}

                  <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                    <PaymentButton
                      appointment={appointment}
                      onPaymentSuccess={handlePaymentSuccess}
                    />
                    
                    {appointment.meetingLink && appointment.isVideoConsultation && (
                      <Button
                        variant="outlined"
                        size="small"
                        href={appointment.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Join Meeting
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};