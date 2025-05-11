import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import { RootState } from '../store';
import {
  createChatSession,
  fetchChatSessions,
  fetchChatSession,
  sendMessage,
  fetchChatHistory,
  endChatSession,
  fetchChatbotConfig,
  clearCurrentSession,
  clearError,
} from '../store/slices/chatbotSlice';

export const useChatbot = () => {
  const dispatch = useAppDispatch();
  const {
    sessions,
    currentSession,
    messages,
    loading,
    error,
    disclaimers,
    medicalSources,
  } = useAppSelector((state: RootState) => state.chatbot);

  const createSession = useCallback(async () => {
    try {
      await dispatch(createChatSession()).unwrap();
      return true;
    } catch (err) {
      console.error('Failed to create chat session:', err);
      return false;
    }
  }, [dispatch]);

  const getSessions = useCallback(async () => {
    try {
      await dispatch(fetchChatSessions()).unwrap();
      return true;
    } catch (err) {
      console.error('Failed to fetch chat sessions:', err);
      return false;
    }
  }, [dispatch]);

  const getSession = useCallback(
    async (sessionId: number) => {
      try {
        await dispatch(fetchChatSession(sessionId)).unwrap();
        return true;
      } catch (err) {
        console.error('Failed to fetch chat session:', err);
        return false;
      }
    },
    [dispatch]
  );

  const sendChatMessage = useCallback(
    async (sessionId: number, content: string) => {
      try {
        await dispatch(sendMessage({ sessionId, content })).unwrap();
        return true;
      } catch (err) {
        console.error('Failed to send message:', err);
        return false;
      }
    },
    [dispatch]
  );

  const getChatHistory = useCallback(
    async (sessionId: number) => {
      try {
        await dispatch(fetchChatHistory(sessionId)).unwrap();
        return true;
      } catch (err) {
        console.error('Failed to fetch chat history:', err);
        return false;
      }
    },
    [dispatch]
  );

  const endSession = useCallback(
    async (sessionId: number) => {
      try {
        await dispatch(endChatSession(sessionId)).unwrap();
        return true;
      } catch (err) {
        console.error('Failed to end chat session:', err);
        return false;
      }
    },
    [dispatch]
  );

  const getConfig = useCallback(async () => {
    try {
      await dispatch(fetchChatbotConfig()).unwrap();
      return true;
    } catch (err) {
      console.error('Failed to fetch chatbot config:', err);
      return false;
    }
  }, [dispatch]);

  const resetCurrentSession = useCallback(() => {
    dispatch(clearCurrentSession());
  }, [dispatch]);

  const resetError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    sessions,
    currentSession,
    messages,
    loading,
    error,
    disclaimers,
    medicalSources,
    createSession,
    getSessions,
    getSession,
    sendChatMessage,
    getChatHistory,
    endSession,
    getConfig,
    resetCurrentSession,
    resetError,
  };
};
