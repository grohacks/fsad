import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import {
  fetchNotifications,
  fetchUnreadNotifications,
  fetchUnreadCount,
  fetchNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearCurrentNotification,
  clearNotificationsError
} from '../store/slices/notificationsSlice';

export const useNotifications = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    notifications, 
    currentNotification, 
    unreadCount,
    loading, 
    error 
  } = useSelector((state: RootState) => state.notifications);

  const getNotifications = useCallback(() => {
    return dispatch(fetchNotifications());
  }, [dispatch]);

  const getUnreadNotifications = useCallback(() => {
    return dispatch(fetchUnreadNotifications());
  }, [dispatch]);

  const getUnreadCount = useCallback(() => {
    return dispatch(fetchUnreadCount());
  }, [dispatch]);

  const getNotificationById = useCallback((id: number) => {
    return dispatch(fetchNotificationById(id));
  }, [dispatch]);

  const markAsRead = useCallback((id: number) => {
    return dispatch(markNotificationAsRead(id));
  }, [dispatch]);

  const markAllAsRead = useCallback(() => {
    return dispatch(markAllNotificationsAsRead());
  }, [dispatch]);

  const clearNotification = useCallback(() => {
    dispatch(clearCurrentNotification());
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearNotificationsError());
  }, [dispatch]);

  return {
    notifications,
    currentNotification,
    unreadCount,
    loading,
    error,
    getNotifications,
    getUnreadNotifications,
    getUnreadCount,
    getNotificationById,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearError,
  };
};
