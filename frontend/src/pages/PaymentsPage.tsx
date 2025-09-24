import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Container,
} from '@mui/material';
import { PaymentHistory } from './PaymentHistory';
import { AppointmentListWithPayments } from '../components/AppointmentListWithPayments';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`payment-tabpanel-${index}`}
      aria-labelledby={`payment-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `payment-tab-${index}`,
    'aria-controls': `payment-tabpanel-${index}`,
  };
}

export const PaymentsPage: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ width: '100%', typography: 'body1' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Payments
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="payment tabs">
            <Tab label="My Appointments" {...a11yProps(0)} />
            <Tab label="Payment History" {...a11yProps(1)} />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <AppointmentListWithPayments />
        </TabPanel>

        <TabPanel value={value} index={1}>
          <PaymentHistory />
        </TabPanel>
      </Box>
    </Container>
  );
};