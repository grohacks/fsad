import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Typography,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';
import { PaymentRequest, PaymentMethod } from '../types';
import { paymentApi } from '../services/api';

interface PaymentFormProps {
  open: boolean;
  onClose: () => void;
  appointmentId: number;
  amount: number;
  onSuccess: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  open,
  onClose,
  appointmentId,
  amount,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<PaymentRequest>({
    appointmentId,
    amount,
    paymentMethod: PaymentMethod.CREDIT_CARD,
    cardNumber: '',
    cardHolderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: keyof PaymentRequest) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    setError(null);
  };

  const handleSelectChange = (field: keyof PaymentRequest) => (
    event: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    setError(null);
  };

  const validateCard = () => {
    if (formData.paymentMethod === PaymentMethod.CREDIT_CARD || formData.paymentMethod === PaymentMethod.DEBIT_CARD) {
      if (!formData.cardNumber || formData.cardNumber.length < 12) {
        return 'Card number must be at least 12 digits';
      }
      if (!formData.cardHolderName.trim()) {
        return 'Card holder name is required';
      }
      if (!formData.expiryMonth || !formData.expiryYear) {
        return 'Expiry date is required';
      }
      if (!formData.cvv || formData.cvv.length !== 3) {
        return 'CVV must be 3 digits';
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return;

    const validationError = validateCard();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await paymentApi.processPayment({
        ...formData,
        appointmentId,
        amount: Number(amount),
      });

      console.log('Payment processed successfully:', response);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
        setFormData({
          appointmentId,
          amount,
          paymentMethod: PaymentMethod.CREDIT_CARD,
          cardNumber: '',
          cardHolderName: '',
          expiryMonth: '',
          expiryYear: '',
          cvv: '',
          description: '',
        });
      }, 2000);
    } catch (err: any) {
      console.error('Payment failed:', err);
      setError(err.response?.data?.error || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setError(null);
      setSuccess(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return { value: month.toString().padStart(2, '0'), label: month.toString().padStart(2, '0') };
  });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5">Process Payment</Typography>
        <Typography variant="body2" color="text.secondary">
          Amount: ₹{amount.toFixed(2)}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Payment processed successfully! Redirecting...
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={formData.paymentMethod}
                  onChange={handleSelectChange('paymentMethod')}
                  label="Payment Method"
                  disabled={loading}
                >
                  <MenuItem value={PaymentMethod.CREDIT_CARD}>Credit Card</MenuItem>
                  <MenuItem value={PaymentMethod.DEBIT_CARD}>Debit Card</MenuItem>
                  <MenuItem value={PaymentMethod.NET_BANKING}>Net Banking</MenuItem>
                  <MenuItem value={PaymentMethod.UPI}>UPI</MenuItem>
                  <MenuItem value={PaymentMethod.WALLET}>Digital Wallet</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {(formData.paymentMethod === PaymentMethod.CREDIT_CARD || 
              formData.paymentMethod === PaymentMethod.DEBIT_CARD) && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Card Number"
                    value={formData.cardNumber}
                    onChange={handleInputChange('cardNumber')}
                    placeholder="1234 5678 9012 3456"
                    inputProps={{ maxLength: 19 }}
                    disabled={loading}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Card Holder Name"
                    value={formData.cardHolderName}
                    onChange={handleInputChange('cardHolderName')}
                    disabled={loading}
                    required
                  />
                </Grid>

                <Grid item xs={4}>
                  <FormControl fullWidth>
                    <InputLabel>Month</InputLabel>
                    <Select
                      value={formData.expiryMonth}
                      onChange={handleSelectChange('expiryMonth')}
                      label="Month"
                      disabled={loading}
                      required
                    >
                      {months.map((month) => (
                        <MenuItem key={month.value} value={month.value}>
                          {month.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={4}>
                  <FormControl fullWidth>
                    <InputLabel>Year</InputLabel>
                    <Select
                      value={formData.expiryYear}
                      onChange={handleSelectChange('expiryYear')}
                      label="Year"
                      disabled={loading}
                      required
                    >
                      {years.map((year) => (
                        <MenuItem key={year} value={year.toString()}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="CVV"
                    value={formData.cvv}
                    onChange={handleInputChange('cvv')}
                    inputProps={{ maxLength: 3 }}
                    disabled={loading}
                    required
                  />
                </Grid>
              </>
            )}

            {formData.paymentMethod === PaymentMethod.UPI && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="UPI ID"
                  value={formData.cardNumber}
                  onChange={handleInputChange('cardNumber')}
                  placeholder="example@upi"
                  disabled={loading}
                  required
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                value={formData.description}
                onChange={handleInputChange('description')}
                multiline
                rows={2}
                disabled={loading}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Processing...' : `Pay ₹${amount.toFixed(2)}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};