import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { format } from 'date-fns';
import { Payment, PaymentStatus } from '../types/payment';
import { paymentApi } from '../services/api';

export const PaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refundDialog, setRefundDialog] = useState<Payment | null>(null);
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    // Wrap in try-catch to prevent component crashes
    const initializePayments = async () => {
      try {
        await fetchPayments();
      } catch (error) {
        console.error('Error initializing payments:', error);
        setError('Failed to initialize payment history');
        setLoading(false);
      }
    };
    
    initializePayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await paymentApi.getPaymentHistory();
      
      // Handle axios response format
      const paymentsData = response.data || [];
      console.log('Payment history response:', paymentsData);
      
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
    } catch (err: any) {
      console.error('Failed to fetch payment history:', err);
      const errorMessage = err.message || err.error || 'Failed to load payment history';
      setError(errorMessage);
      setPayments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (payment: Payment) => {
    if (!payment.appointmentId) return;

    setRefunding(true);
    try {
      await paymentApi.refundPayment(payment.appointmentId);
      setRefundDialog(null);
      await fetchPayments(); // Refresh the list
    } catch (err: any) {
      console.error('Refund failed:', err);
      setError(err.response?.data?.error || 'Refund processing failed');
    } finally {
      setRefunding(false);
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'success';
      case PaymentStatus.PENDING:
        return 'warning';
      case PaymentStatus.PROCESSING:
        return 'info';
      case PaymentStatus.FAILED:
        return 'error';
      case PaymentStatus.CANCELLED:
        return 'default';
      case PaymentStatus.REFUNDED:
        return 'secondary';
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
        Payment History
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {payments?.length === 0 && !loading ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              No payment history found.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        payments?.length > 0 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(payment.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {payment.doctorName || 'Unknown Doctor'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        ₹{payment.amount?.toFixed(2) || '0.00'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {payment.paymentMethod?.replace('_', ' ') || 'Unknown'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={payment.status}
                        color={getStatusColor(payment.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {payment.paymentReference || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {payment.status === PaymentStatus.COMPLETED && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="secondary"
                          onClick={() => setRefundDialog(payment)}
                        >
                          Request Refund
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {/* Refund Confirmation Dialog */}
      <Dialog
        open={!!refundDialog}
        onClose={() => !refunding && setRefundDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Refund</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to request a refund for this payment?
          </Typography>
          {refundDialog && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Amount:</strong> ₹{refundDialog.amount?.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Doctor:</strong> {refundDialog.doctorName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Date:</strong> {formatDate(refundDialog.createdAt)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Reference:</strong> {refundDialog.paymentReference}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundDialog(null)} disabled={refunding}>
            Cancel
          </Button>
          <Button
            onClick={() => refundDialog && handleRefund(refundDialog)}
            variant="contained"
            color="secondary"
            disabled={refunding}
            startIcon={refunding && <CircularProgress size={20} />}
          >
            {refunding ? 'Processing...' : 'Confirm Refund'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};