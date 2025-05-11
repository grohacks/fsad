import React, { useState, useEffect } from "react";
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Event as EventIcon,
  Info as InfoIcon,
  MarkEmailRead as MarkEmailReadIcon,
  DoneAll as DoneAllIcon,
} from "@mui/icons-material";
import { useNotifications } from "../hooks/useNotifications";
import { Notification, NotificationType } from "../types";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const NotificationCenter: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const {
    notifications,
    unreadCount,
    loading,
    getUnreadNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  useEffect(() => {
    // Fetch unread count on component mount
    getUnreadCount();

    // Set up polling for unread count (every 2 minutes instead of 30 seconds)
    // This reduces the number of API calls
    const interval = setInterval(() => {
      getUnreadCount();
    }, 120000); // Changed from 30000 to 120000 (2 minutes)

    return () => clearInterval(interval);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove dependency to prevent excessive re-renders

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    // Fetch unread notifications when menu is opened
    getUnreadNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark notification as read
    markAsRead(notification.id);

    // Navigate based on notification type
    if (notification.relatedAppointment) {
      navigate(`/appointments`);
    }

    handleClose();
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "APPOINTMENT_REQUESTED":
        return <EventIcon color="info" />;
      case "APPOINTMENT_CONFIRMED":
        return <CheckCircleIcon color="success" />;
      case "APPOINTMENT_REJECTED":
        return <CancelIcon color="error" />;
      case "APPOINTMENT_CANCELLED":
        return <CancelIcon color="warning" />;
      case "APPOINTMENT_REMINDER":
        return <NotificationsActiveIcon color="primary" />;
      default:
        return <InfoIcon color="action" />;
    }
  };

  // Custom component for notification secondary text
  const NotificationSecondaryText = ({
    notification,
  }: {
    notification: Notification;
  }) => {
    const formattedDate = format(
      new Date(notification.createdAt),
      "MMM d, yyyy h:mm a"
    );

    return (
      <Box sx={{ mt: 0.5 }}>
        <Box
          component="span"
          sx={{
            display: "block",
            fontSize: "0.75rem",
            color: "text.secondary",
            mb: 0.5,
          }}
        >
          {formattedDate}
        </Box>
        <Box
          component="span"
          sx={{
            display: "block",
            fontSize: "0.875rem",
            color: "text.secondary",
          }}
        >
          {notification.message}
        </Box>
      </Box>
    );
  };

  const getNotificationSecondaryText = (notification: Notification) => {
    // For ListItemText, we still need to return a string to avoid the nested <p> warning
    const formattedDate = format(
      new Date(notification.createdAt),
      "MMM d, yyyy h:mm a"
    );
    return `${formattedDate}\n${notification.message}`;
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          onClick={handleClick}
          size="large"
          color="inherit"
          aria-label="notifications"
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 320,
            maxHeight: 400,
            overflow: "auto",
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Tooltip title="Mark all as read">
              <IconButton size="small" onClick={handleMarkAllAsRead}>
                <DoneAllIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Divider />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No unread notifications
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    bgcolor: notification.isRead
                      ? "transparent"
                      : "rgba(25, 118, 210, 0.08)",
                    "&:hover": {
                      bgcolor: notification.isRead
                        ? "rgba(0, 0, 0, 0.04)"
                        : "rgba(25, 118, 210, 0.12)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.title}
                    // Use a custom component instead of a string to avoid the nested <p> warning
                    secondary={
                      <NotificationSecondaryText notification={notification} />
                    }
                    primaryTypographyProps={{
                      variant: "subtitle2",
                      fontWeight: notification.isRead ? "normal" : "bold",
                    }}
                    // Only disable typography for the secondary text
                    disableTypography={false}
                    secondaryTypographyProps={{ component: "div" }}
                  />
                  {!notification.isRead && (
                    <Tooltip title="Mark as read">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                      >
                        <MarkEmailReadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}

        {notifications.length > 0 && (
          <Box sx={{ p: 1, display: "flex", justifyContent: "center" }}>
            <Button
              size="small"
              onClick={() => {
                handleClose();
                // Could navigate to a full notifications page here
              }}
            >
              View All
            </Button>
          </Box>
        )}
      </Menu>
    </>
  );
};

export default NotificationCenter;
