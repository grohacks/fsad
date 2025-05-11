import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import { appointmentApi } from "../services/api";
import {
  fetchAppointments,
  fetchAppointmentById,
  fetchAppointmentsByDateRange,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  fetchMyAppointments,
  fetchMyUpcomingAppointments,
  confirmAppointment,
  clearCurrentAppointment,
  clearAppointmentsError,
  setAppointments,
} from "../store/slices/appointmentsSlice";
import { Appointment } from "../types";

export const useAppointments = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { appointments, currentAppointment, loading, error } = useSelector(
    (state: RootState) => state.appointments
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const getAppointments = useCallback(() => {
    // Only admins can fetch all appointments
    if (user?.role === "ROLE_ADMIN") {
      return dispatch(fetchAppointments());
    } else {
      // Doctors and patients fetch their own appointments
      return dispatch(fetchMyAppointments());
    }
  }, [dispatch, user?.role]);

  const getAppointmentById = useCallback(
    (id: number) => {
      return dispatch(fetchAppointmentById(id));
    },
    [dispatch]
  );

  const getAppointmentsByDateRange = useCallback(
    (start: string, end: string) => {
      // Only dispatch if we have valid dates
      if (start && end) {
        return dispatch(fetchAppointmentsByDateRange({ start, end }));
      }
      return Promise.resolve();
    },
    [dispatch]
  );

  const addAppointment = useCallback(
    (appointmentData: Omit<Appointment, "id" | "createdAt" | "updatedAt">) => {
      return dispatch(createAppointment(appointmentData));
    },
    [dispatch]
  );

  const editAppointment = useCallback(
    (id: number, appointmentData: Partial<Appointment>) => {
      return dispatch(updateAppointment({ id, appointmentData }));
    },
    [dispatch]
  );

  const removeAppointment = useCallback(
    (id: number) => {
      return dispatch(deleteAppointment(id));
    },
    [dispatch]
  );

  const rejectAppointment = useCallback(
    async (id: number, reason: string) => {
      try {
        console.log(`Rejecting appointment with ID: ${id}, reason: ${reason}`);

        // Use the dedicated API endpoint for rejecting appointments
        const response = await appointmentApi.rejectAppointment(id, reason);
        console.log(`Appointment rejected successfully:`, response.data);

        // Update the Redux store with the updated appointment
        dispatch(
          updateAppointment({
            id,
            appointmentData: response.data,
          })
        );

        // Refresh the appointments list
        dispatch(fetchMyUpcomingAppointments());

        return response.data;
      } catch (error) {
        console.error("Error rejecting appointment:", error);
        throw error;
      }
    },
    [dispatch, fetchMyUpcomingAppointments]
  );

  const getMyAppointments = useCallback(() => {
    console.log("Fetching my appointments for user role:", user?.role);
    return dispatch(fetchMyAppointments()).then((result) => {
      console.log("My appointments result:", result);
      return result;
    });
  }, [dispatch, user?.role]);

  const getMyUpcomingAppointments = useCallback(() => {
    console.log("Fetching my upcoming appointments for user role:", user?.role);

    // If user is a doctor, try the direct endpoint first
    if (user?.role === "ROLE_DOCTOR" && user?.id) {
      console.log("Using direct endpoint for doctor ID:", user.id);

      return appointmentApi
        .getAppointmentsForDoctor(user.id)
        .then((response) => {
          console.log("Direct endpoint response:", response.data);

          if (response.data && response.data.length > 0) {
            // Update the Redux store with the fetched appointments
            dispatch(setAppointments(response.data));
            return { payload: response.data };
          } else {
            // Fall back to the regular endpoint if no appointments found
            console.log(
              "No appointments found with direct endpoint, falling back to regular endpoint"
            );
            return dispatch(fetchMyUpcomingAppointments()).then((result) => {
              console.log("Fetched my upcoming appointments:", result);
              return result;
            });
          }
        })
        .catch((error) => {
          console.error("Error using direct endpoint:", error);
          // Fall back to the regular endpoint if there's an error
          return dispatch(fetchMyUpcomingAppointments()).then((result) => {
            console.log("Fetched my upcoming appointments:", result);
            return result;
          });
        });
    } else {
      // For non-doctors, use the regular endpoint
      return dispatch(fetchMyUpcomingAppointments()).then((result) => {
        console.log("My upcoming appointments result:", result);
        return result;
      });
    }
  }, [dispatch, user?.role, user?.id]);

  const confirmAppointmentStatus = useCallback(
    async (id: number) => {
      try {
        console.log(`Confirming appointment with ID: ${id}`);

        // Use the dedicated API endpoint for confirming appointments
        const response = await appointmentApi.confirmAppointment(id);
        console.log(`Appointment confirmed successfully:`, response.data);

        // Update the Redux store with the updated appointment
        dispatch(
          updateAppointment({
            id,
            appointmentData: response.data,
          })
        );

        // Refresh the appointments list
        dispatch(fetchMyUpcomingAppointments());

        return response.data;
      } catch (error) {
        console.error("Error confirming appointment:", error);
        throw error;
      }
    },
    [dispatch, fetchMyUpcomingAppointments]
  );

  const clearAppointment = useCallback(() => {
    dispatch(clearCurrentAppointment());
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearAppointmentsError());
  }, [dispatch]);

  return {
    appointments,
    currentAppointment,
    loading,
    error,
    getAppointments,
    getAppointmentById,
    getAppointmentsByDateRange,
    addAppointment,
    editAppointment,
    removeAppointment,
    rejectAppointment,
    getMyAppointments,
    getMyUpcomingAppointments,
    confirmAppointmentStatus,
    clearAppointment,
    clearError,
  };
};
