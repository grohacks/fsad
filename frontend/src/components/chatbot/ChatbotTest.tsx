import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';
import generateMedicalResponse from '../../utils/medicalKnowledge';

const ChatbotTest: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');

  const handleTest = () => {
    if (!query.trim()) return;
    
    try {
      const result = generateMedicalResponse(query);
      console.log('Test response:', result);
      setResponse(result);
    } catch (error) {
      console.error('Error generating response:', error);
      setResponse('Error generating response');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Chatbot Test Component
      </Typography>
      
      <TextField
        fullWidth
        label="Enter medical query"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        margin="normal"
      />
      
      <Button 
        variant="contained" 
        onClick={handleTest}
        sx={{ mt: 2, mb: 3 }}
      >
        Test Response
      </Button>
      
      {response && (
        <Paper sx={{ p: 2, whiteSpace: 'pre-wrap' }}>
          <Typography variant="h6" gutterBottom>
            Response:
          </Typography>
          <Typography variant="body1">
            {response}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ChatbotTest;
