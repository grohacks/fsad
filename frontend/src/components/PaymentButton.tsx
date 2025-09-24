import React, { useState } from 'react';
import { Button, Chip } from '@mui/material';
import { PaymentForm } from './PaymentForm';
import { Appointment } from '../types';

interface PaymentButtonProps {
  appointment: Appointment;
  onPaymentSuccess: () => void;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  appointment,
  onPaymentSuccess,
}) => {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // Check if appointment has payment information
  const hasPaymentInfo = appointment.paymentAmount && appointment.paymentStatus;
  const isPaid = hasPaymentInfo && appointment.paymentStatus === 'PAID';
  const isUnpaid = hasPaymentInfo && appointment.paymentStatus === 'UNPAID';

  const getDefaultAmount = () => {
    // Return existing payment amount or default consultation fee
    return appointment.paymentAmount || 500; // Default ₹500 consultation fee
  };

  if (isPaid) {
    return (
      <Chip
        label={`Paid ₹${appointment.paymentAmount?.toFixed(2)}`}
        color="success"
        size="small"
      />
    );
  }

  if (isUnpaid) {
    return (
      <Chip
        label={`Unpaid ₹${appointment.paymentAmount?.toFixed(2)}`}
        color="warning"
        size="small"
      />
    );
  }

  // Show pay button for completed appointments without payment
  if (appointment.status === 'COMPLETED') {
    return (
      <>
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => setPaymentDialogOpen(true)}
        >
          Pay Now
        </Button>
        
        <PaymentForm
          open={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          appointmentId={appointment.id}
          amount={getDefaultAmount()}
          onSuccess={() => {
            onPaymentSuccess();
            setPaymentDialogOpen(false);
          }}
        />
      </>
    );
  }

  // Show pay button for approved appointments (pre-payment)
  if (appointment.status === 'APPROVED') {
    return (
      <>
        <Button
          variant="contained"
          color="success"
          size="small"
          onClick={() => setPaymentDialogOpen(true)}
        >
          Pay in Advance
        </Button>
        
        <PaymentForm
          open={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          appointmentId={appointment.id}
          amount={getDefaultAmount()}
          onSuccess={() => {
            onPaymentSuccess();
            setPaymentDialogOpen(false);
          }}
        />
      </>
    );
  }

  // Show appropriate status for other appointment statuses
  if (appointment.status === 'PENDING') {
    return (
      <Chip
        label="Pending Approval"
        color="warning"
        size="small"
        variant="outlined"
      />
    );
  }

  if (appointment.status === 'CANCELLED') {
    return (
      <Chip
        label="Cancelled"
        color="error"
        size="small"
        variant="outlined"
      />
    );
  }

  // Default fallback
  return (
    <Chip
      label="No Payment Required"
      color="default"
      size="small"
      variant="outlined"
    />
  );
};