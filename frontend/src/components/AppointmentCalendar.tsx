import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  Tooltip,
} from "@mui/material";
import {
  CalendarMonth,
  Today,
  Event,
  VideoCall,
  Person,
  MedicalServices,
} from "@mui/icons-material";
import { useAppointments } from "../hooks/useAppointments";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { Appointment } from "../types";
import {
  format,
  startOfWeek,
  addDays,
  startOfDay,
  addWeeks,
  subWeeks,
} from "date-fns";

interface AppointmentCalendarProps {
  onSelectAppointment: (appointment: Appointment) => void;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  onSelectAppointment,
}) => {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(currentDate));
  const { user } = useSelector((state: RootState) => state.auth);

  const { appointments, loading, error, getAppointmentsByDateRange } =
    useAppointments();

  useEffect(() => {
    const start = startOfWeek(currentDate);
    setWeekStart(start);

    // We're not automatically fetching data here anymore
    // This prevents the infinite loop
  }, [currentDate]);

  const nextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const prevWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  // Add a manual fetch function
  const fetchAppointments = () => {
    const start = startOfWeek(currentDate);
    const startDate = start.toISOString();
    const endDate = addDays(start, 7).toISOString();
    getAppointmentsByDateRange(startDate, endDate);
  };

  const getDayAppointments = (day: Date) => {
    const dayStart = startOfDay(day);
    const dayEnd = addDays(dayStart, 1);

    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.appointmentDateTime);
      return appointmentDate >= dayStart && appointmentDate < dayEnd;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return theme.palette.success.main;
      case "PENDING":
        return theme.palette.warning.main;
      case "CANCELLED":
        return theme.palette.error.main;
      case "COMPLETED":
        return theme.palette.info.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Approved";
      case "PENDING":
        return "Pending";
      case "CANCELLED":
        return "Cancelled";
      case "COMPLETED":
        return "Completed";
      default:
        return status;
    }
  };

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayAppointments = getDayAppointments(day);

      days.push(
        <Grid item xs key={i}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              height: "100%",
              minHeight: 200,
              bgcolor:
                format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                  ? "rgba(25, 118, 210, 0.1)"
                  : "white",
            }}
          >
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              align="center"
              gutterBottom
            >
              {format(day, "EEE")}
            </Typography>
            <Typography variant="h6" align="center" gutterBottom>
              {format(day, "d")}
            </Typography>
            <Box sx={{ mt: 2 }}>
              {dayAppointments.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                >
                  No appointments
                </Typography>
              ) : (
                dayAppointments.map((appointment) => (
                  <Tooltip
                    key={appointment.id}
                    title={`${getStatusLabel(appointment.status)} - ${
                      appointment.title
                    }`}
                    arrow
                  >
                    <Box
                      sx={{
                        mb: 1,
                        p: 1,
                        borderRadius: 1,
                        bgcolor: getStatusColor(appointment.status),
                        color: "white",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                      }}
                      onClick={() => onSelectAppointment(appointment)}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        {format(
                          new Date(appointment.appointmentDateTime),
                          "h:mm a"
                        )}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ maxWidth: "80%" }}
                        >
                          {appointment.title}
                        </Typography>
                        {appointment.isVideoConsultation && (
                          <VideoCall fontSize="small" />
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        {getStatusLabel(appointment.status)}
                      </Typography>
                    </Box>
                  </Tooltip>
                ))
              )}
            </Box>
          </Paper>
        </Grid>
      );
    }
    return days;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={300}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5" component="h2">
          <CalendarMonth sx={{ mr: 1, verticalAlign: "middle" }} />
          Appointment Calendar
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Today />}
            onClick={today}
            sx={{ mr: 1 }}
          >
            Today
          </Button>
          <Button variant="outlined" onClick={prevWeek} sx={{ mr: 1 }}>
            Previous
          </Button>
          <Button variant="outlined" onClick={nextWeek} sx={{ mr: 1 }}>
            Next
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={fetchAppointments}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Typography variant="h6" align="center" gutterBottom>
        Week of {format(weekStart, "MMMM d, yyyy")}
      </Typography>

      <Grid container spacing={2}>
        {renderDays()}
      </Grid>

      <Box mt={3}>
        <Typography variant="subtitle1" gutterBottom>
          Legend:
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          <Chip
            label="Approved"
            size="small"
            sx={{ bgcolor: getStatusColor("APPROVED"), color: "white" }}
          />
          <Chip
            label="Pending"
            size="small"
            sx={{ bgcolor: getStatusColor("PENDING"), color: "white" }}
          />
          <Chip
            label="Cancelled"
            size="small"
            sx={{ bgcolor: getStatusColor("CANCELLED"), color: "white" }}
          />
          <Chip
            label="Completed"
            size="small"
            sx={{ bgcolor: getStatusColor("COMPLETED"), color: "white" }}
          />
          <Chip
            icon={<VideoCall />}
            label="Video Consultation"
            size="small"
            variant="outlined"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default AppointmentCalendar;
