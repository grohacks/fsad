import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Appointment } from "../../types";
import { appointmentApi } from "../../services/api";

interface AppointmentsState {
  appointments: Appointment[];
  currentAppointment: Appointment | null;
  loading: boolean;
  error: string | null;
}

const initialState: AppointmentsState = {
  appointments: [],
  currentAppointment: null,
  loading: false,
  error: null,
};

export const fetchAppointments = createAsyncThunk(
  "appointments/fetchAll",
  async () => {
    const response = await appointmentApi.getAll();
    return response.data;
  }
);

export const fetchAppointmentById = createAsyncThunk(
  "appointments/fetchById",
  async (id: number) => {
    const response = await appointmentApi.getById(id);
    return response.data;
  }
);

export const fetchAppointmentsByDateRange = createAsyncThunk(
  "appointments/fetchByDateRange",
  async ({ start, end }: { start: string; end: string }) => {
    const response = await appointmentApi.getByDateRange(start, end);
    return response.data;
  }
);

export const createAppointment = createAsyncThunk(
  "appointments/create",
  async (
    appointmentData: Omit<Appointment, "id" | "createdAt" | "updatedAt">,
    { rejectWithValue }
  ) => {
    try {
      console.log("Creating appointment with data:", appointmentData);

      // Validate required fields
      if (!appointmentData.title) {
        return rejectWithValue("Title is required");
      }

      if (!appointmentData.appointmentDateTime) {
        return rejectWithValue("Appointment date and time are required");
      }

      if (!appointmentData.doctor && !appointmentData.doctorId) {
        return rejectWithValue("Doctor selection is required");
      }

      // Import axios directly
      const axios = (await import("axios")).default;

      // First test if the endpoint is accessible
      console.log("Testing direct appointment endpoint from Redux slice");
      try {
        const testResponse = await axios.get(
          "http://localhost:8080/direct-appointment/test"
        );
        console.log(
          "Direct appointment test endpoint response:",
          testResponse.data
        );
      } catch (testError) {
        console.error("Error testing direct appointment endpoint:", testError);
      }

      // Try the direct appointment endpoint
      console.log("Trying direct appointment endpoint from Redux slice");

      // Ensure we're not sending any status field to prevent "Data truncated for column 'status'" error
      const appointmentDataWithoutStatus = {
        ...appointmentData,
      };

      // Explicitly delete the status field if it exists
      if ("status" in appointmentDataWithoutStatus) {
        delete appointmentDataWithoutStatus.status;
      }

      console.log(
        "Appointment data (without status):",
        JSON.stringify(appointmentDataWithoutStatus, null, 2)
      );
      const response = await axios.post(
        "http://localhost:8080/direct-appointment",
        appointmentDataWithoutStatus,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      console.log("Appointment created successfully:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Error creating appointment:", error);

      // Handle different error formats
      console.log("Error object:", error);

      if (error.response && error.response.data) {
        console.error("Error response data:", error.response.data);
        return rejectWithValue(error.response.data.error || "Server error");
      } else if (error.error) {
        return rejectWithValue(error.error);
      } else if (error.message) {
        return rejectWithValue(error.message);
      } else if (typeof error === "string") {
        return rejectWithValue(error);
      } else {
        return rejectWithValue("Failed to create appointment");
      }
    }
  }
);

export const updateAppointment = createAsyncThunk(
  "appointments/update",
  async ({
    id,
    appointmentData,
  }: {
    id: number;
    appointmentData: Partial<Appointment>;
  }) => {
    const response = await appointmentApi.update(id, appointmentData);
    return response.data;
  }
);

export const deleteAppointment = createAsyncThunk(
  "appointments/delete",
  async (id: number) => {
    await appointmentApi.delete(id);
    return id;
  }
);

export const fetchMyAppointments = createAsyncThunk(
  "appointments/fetchMyAppointments",
  async () => {
    const response = await appointmentApi.getMyAppointments();
    return response.data;
  }
);

export const fetchMyUpcomingAppointments = createAsyncThunk(
  "appointments/fetchMyUpcomingAppointments",
  async () => {
    const response = await appointmentApi.getMyUpcomingAppointments();
    return response.data;
  }
);

export const confirmAppointment = createAsyncThunk(
  "appointments/confirm",
  async (id: number) => {
    const response = await appointmentApi.confirmAppointment(id);
    return response.data;
  }
);

const appointmentsSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {
    clearCurrentAppointment: (state) => {
      state.currentAppointment = null;
    },
    clearAppointmentsError: (state) => {
      state.error = null;
    },
    setAppointments: (state, action) => {
      state.appointments = action.payload;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all appointments
      .addCase(fetchAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch appointments";
      })

      // Fetch appointment by ID
      .addCase(fetchAppointmentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointmentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAppointment = action.payload;
      })
      .addCase(fetchAppointmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch appointment";
      })

      // Fetch appointments by date range
      .addCase(fetchAppointmentsByDateRange.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointmentsByDateRange.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchAppointmentsByDateRange.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to fetch appointments by date range";
      })

      // Create appointment
      .addCase(createAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments.push(action.payload);
        state.currentAppointment = action.payload;
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create appointment";
      })

      // Update appointment
      .addCase(updateAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAppointment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.appointments.findIndex(
          (appointment) => appointment.id === action.payload.id
        );
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
        state.currentAppointment = action.payload;
      })
      .addCase(updateAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update appointment";
      })

      // Delete appointment
      .addCase(deleteAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAppointment.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = state.appointments.filter(
          (appointment) => appointment.id !== action.payload
        );
        if (state.currentAppointment?.id === action.payload) {
          state.currentAppointment = null;
        }
      })
      .addCase(deleteAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete appointment";
      })

      // Fetch my appointments
      .addCase(fetchMyAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchMyAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to fetch your appointments";
      })

      // Fetch my upcoming appointments
      .addCase(fetchMyUpcomingAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyUpcomingAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchMyUpcomingAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to fetch your upcoming appointments";
      })

      // Confirm appointment
      .addCase(confirmAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmAppointment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.appointments.findIndex(
          (appointment) => appointment.id === action.payload.id
        );
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
        if (state.currentAppointment?.id === action.payload.id) {
          state.currentAppointment = action.payload;
        }
      })
      .addCase(confirmAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to confirm appointment";
      });
  },
});

export const {
  clearCurrentAppointment,
  clearAppointmentsError,
  setAppointments,
} = appointmentsSlice.actions;

export default appointmentsSlice.reducer;
