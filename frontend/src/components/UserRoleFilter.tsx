import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Chip, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  minWidth: 200,
  margin: theme.spacing(1),
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

interface UserRoleFilterProps {
  selectedRoles: string[];
  onChange: (roles: string[]) => void;
}

const UserRoleFilter: React.FC<UserRoleFilterProps> = ({ selectedRoles, onChange }) => {
  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    onChange(typeof value === 'string' ? value.split(',') : value);
  };

  const roles = [
    { value: 'ROLE_ADMIN', label: 'Admin' },
    { value: 'ROLE_DOCTOR', label: 'Doctor' },
    { value: 'ROLE_PATIENT', label: 'Patient' },
  ];

  return (
    <StyledFormControl>
      <InputLabel id="role-filter-label">Filter by Role</InputLabel>
      <Select
        labelId="role-filter-label"
        id="role-filter"
        multiple
        value={selectedRoles}
        onChange={handleChange}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {(selected as string[]).map((value) => {
              const role = roles.find(r => r.value === value);
              return (
                <StyledChip 
                  key={value} 
                  label={role?.label || value} 
                  color={
                    value === 'ROLE_ADMIN' ? 'primary' : 
                    value === 'ROLE_DOCTOR' ? 'success' : 
                    'default'
                  }
                />
              );
            })}
          </Box>
        )}
      >
        {roles.map((role) => (
          <MenuItem key={role.value} value={role.value}>
            {role.label}
          </MenuItem>
        ))}
      </Select>
    </StyledFormControl>
  );
};

export default UserRoleFilter;
