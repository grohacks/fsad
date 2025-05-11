import React from 'react';
import { 
  Timeline, 
  TimelineItem, 
  TimelineSeparator, 
  TimelineConnector, 
  TimelineContent, 
  TimelineDot, 
  TimelineOppositeContent 
} from '@mui/lab';
import { 
  Paper, 
  Typography, 
  Chip, 
  Box, 
  useTheme 
} from '@mui/material';
import { 
  MedicalServices, 
  Science, 
  Medication, 
  Event 
} from '@mui/icons-material';
import { MedicalRecord, LabReport, Prescription } from '../types';

interface TimelineEvent {
  id: number;
  type: 'medical-record' | 'lab-report' | 'prescription';
  date: string;
  title: string;
  description: string;
  doctor?: string;
}

interface HealthTimelineProps {
  medicalRecords: MedicalRecord[];
  labReports: LabReport[];
  prescriptions: Prescription[];
}

const HealthTimeline: React.FC<HealthTimelineProps> = ({ 
  medicalRecords, 
  labReports, 
  prescriptions 
}) => {
  const theme = useTheme();

  // Convert all data to timeline events
  const createTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Add medical records
    medicalRecords.forEach(record => {
      events.push({
        id: record.id,
        type: 'medical-record',
        date: record.date,
        title: `Medical Visit: ${record.diagnosis}`,
        description: record.treatment,
        doctor: record.doctor
      });
    });

    // Add lab reports
    labReports.forEach(report => {
      events.push({
        id: report.id,
        type: 'lab-report',
        date: report.date,
        title: `Lab Test: ${report.testName}`,
        description: report.result,
        doctor: report.doctor
      });
    });

    // Add prescriptions
    prescriptions.forEach(prescription => {
      events.push({
        id: prescription.id,
        type: 'prescription',
        date: prescription.date,
        title: `Prescription: ${prescription.medication}`,
        description: `${prescription.dosage}, ${prescription.frequency}, ${prescription.duration}`,
        doctor: prescription.doctor
      });
    });

    // Sort by date (newest first)
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const timelineEvents = createTimelineEvents();

  const getIconByType = (type: string) => {
    switch (type) {
      case 'medical-record':
        return <MedicalServices />;
      case 'lab-report':
        return <Science />;
      case 'prescription':
        return <Medication />;
      default:
        return <Event />;
    }
  };

  const getColorByType = (type: string) => {
    switch (type) {
      case 'medical-record':
        return theme.palette.primary.main;
      case 'lab-report':
        return theme.palette.info.main;
      case 'prescription':
        return theme.palette.success.main;
      default:
        return theme.palette.secondary.main;
    }
  };

  return (
    <Timeline position="alternate">
      {timelineEvents.map((event) => (
        <TimelineItem key={`${event.type}-${event.id}`}>
          <TimelineOppositeContent color="text.secondary">
            <Typography variant="body2">
              {new Date(event.date).toLocaleDateString()}
            </Typography>
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot sx={{ bgcolor: getColorByType(event.type) }}>
              {getIconByType(event.type)}
            </TimelineDot>
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>
            <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" component="h3">
                {event.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {event.description}
              </Typography>
              {event.doctor && (
                <Box mt={1}>
                  <Chip 
                    label={`Dr. ${event.doctor}`} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                </Box>
              )}
            </Paper>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};

export default HealthTimeline;
