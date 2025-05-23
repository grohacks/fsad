import React from "react";
import { Tooltip, IconButton } from "@mui/material";
import { Check as CheckIcon, Cancel as CancelIcon } from "@mui/icons-material";

interface AppointmentActionsProps {
  appointmentId: number;
  status: string;
  userRole: string | undefined;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

const AppointmentActions: React.FC<AppointmentActionsProps> = ({
  appointmentId,
  status,
  userRole,
  onApprove,
  onReject,
}) => {
  // Check if the appointment status is PENDING (case-insensitive and more lenient)
  const statusStr = String(status || "").toUpperCase();
  const isPending =
    statusStr.includes("PENDING") ||
    statusStr.includes("REQUESTED") ||
    statusStr === "0" || // Sometimes enum values are serialized as numbers
    status === 0; // Handle numeric status

  // Check if the user is a doctor or admin (more lenient)
  const isAuthorized =
    userRole === "ROLE_DOCTOR" ||
    userRole === "ROLE_ADMIN" ||
    String(userRole || "").includes("DOCTOR") ||
    String(userRole || "").includes("ADMIN");

  // Enhanced debugging
  console.log(`AppointmentActions: Appointment ${appointmentId}`);
  console.log(`- Status: ${status} (${typeof status})`);
  console.log(`- User Role: ${userRole} (${typeof userRole})`);
  console.log(`- isPending: ${isPending}`);
  console.log(`- isAuthorized: ${isAuthorized}`);
  console.log(`- Will show buttons: ${isAuthorized && isPending}`);

  if (!isAuthorized || !isPending) {
    console.log(
      `AppointmentActions: Not rendering buttons because isAuthorized=${isAuthorized}, isPending=${isPending}`
    );
    return null;
  }

  console.log(
    `AppointmentActions: Rendering approve/reject buttons for appointment ${appointmentId}`
  );

  return (
    <>
      <Tooltip title="Approve Appointment">
        <IconButton
          size="small"
          color="success"
          onClick={() => onApprove(appointmentId)}
          sx={{ mr: 1 }}
        >
          <CheckIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="Reject Appointment">
        <IconButton
          size="small"
          color="error"
          onClick={() => onReject(appointmentId)}
          sx={{ mr: 1 }}
        >
          <CancelIcon />
        </IconButton>
      </Tooltip>
    </>
  );
};

export default AppointmentActions;
