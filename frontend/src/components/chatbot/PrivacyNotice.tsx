import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Storage as StorageIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VerifiedUser as VerifiedUserIcon,
} from '@mui/icons-material';

interface PrivacyNoticeProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({ open, onClose, onAccept }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <SecurityIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Healthcare Chatbot Privacy Notice</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" paragraph>
          Your privacy and the security of your health information are important to us. 
          Please review this privacy notice before using the Healthcare Chatbot.
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          How We Handle Your Information
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon>
              <StorageIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Data Storage" 
              secondary="Your chat conversations are stored securely in our database and are associated with your account." 
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <VisibilityIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Data Access" 
              secondary="Only you and authorized healthcare providers with appropriate permissions can access your chat history." 
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <DeleteIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Data Retention" 
              secondary="Chat history is retained as part of your medical record in accordance with healthcare data retention policies." 
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <VerifiedUserIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Compliance" 
              secondary="Our chatbot service complies with healthcare data protection regulations including HIPAA (where applicable)." 
            />
          </ListItem>
        </List>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          Important Disclaimers
        </Typography>
        
        <Typography variant="body2" paragraph>
          • The Healthcare Chatbot provides general health information and is not a substitute for professional medical advice, diagnosis, or treatment.
        </Typography>
        
        <Typography variant="body2" paragraph>
          • Always consult with a qualified healthcare provider for medical advice tailored to your specific situation.
        </Typography>
        
        <Typography variant="body2" paragraph>
          • In case of a medical emergency, call your local emergency services immediately.
        </Typography>
        
        <Typography variant="body2" paragraph>
          • The information provided by the chatbot is sourced from reputable medical databases but may not be comprehensive or applicable to all individuals.
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="body2" color="text.secondary">
          By clicking "Accept & Continue," you acknowledge that you have read and understood this privacy notice and agree to the storage and processing of your chat data as described above.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Decline
        </Button>
        <Button onClick={onAccept} variant="contained" color="primary">
          Accept & Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrivacyNotice;
