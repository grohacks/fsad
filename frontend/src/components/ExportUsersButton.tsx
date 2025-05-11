import React from 'react';
import { Button } from '@mui/material';
import { FileDownload as FileDownloadIcon } from '@mui/icons-material';
import { User } from '../types';
import { styled } from '@mui/material/styles';

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
  color: 'white',
  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
  '&:hover': {
    background: 'linear-gradient(45deg, #1976D2 30%, #0FBFE9 90%)',
  },
}));

interface ExportUsersButtonProps {
  users: User[];
  selectedUsers?: number[]; // Optional array of selected user IDs
}

const ExportUsersButton: React.FC<ExportUsersButtonProps> = ({ users, selectedUsers }) => {
  const exportToCSV = () => {
    // Filter users if selectedUsers is provided
    const usersToExport = selectedUsers && selectedUsers.length > 0
      ? users.filter(user => selectedUsers.includes(user.id))
      : users;

    // Define CSV headers
    const headers = [
      'ID',
      'First Name',
      'Last Name',
      'Email',
      'Role',
      'Created At'
    ].join(',');

    // Convert users to CSV rows
    const csvRows = usersToExport.map(user => {
      const values = [
        user.id,
        `"${user.firstName}"`, // Wrap in quotes to handle commas in names
        `"${user.lastName}"`,
        `"${user.email}"`,
        user.role,
        new Date(user.createdAt).toLocaleDateString()
      ];
      return values.join(',');
    });

    // Combine headers and rows
    const csvContent = [headers, ...csvRows].join('\\n');

    // Create a Blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <StyledButton
      variant="contained"
      startIcon={<FileDownloadIcon />}
      onClick={exportToCSV}
      disabled={selectedUsers && selectedUsers.length === 0}
    >
      {selectedUsers && selectedUsers.length > 0
        ? `Export ${selectedUsers.length} Selected Users`
        : 'Export All Users'}
    </StyledButton>
  );
};

export default ExportUsersButton;
