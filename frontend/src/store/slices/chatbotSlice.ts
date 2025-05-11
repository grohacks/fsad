import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { chatbotApi } from "../../services/api";

export interface ChatMessage {
  id?: number;
  content: string;
  sender: string;
  timestamp: string;
}

export interface ChatSession {
  id: number;
  startTime: string;
  endTime?: string;
  lastActivityTime?: string;
  isActive: boolean;
  messages?: ChatMessage[];
}

interface ChatbotState {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  disclaimers: string[];
  medicalSources: string[];
}

// Default disclaimers and sources in case the backend fails to provide them
const DEFAULT_DISCLAIMERS = [
  "The information provided by this chatbot is for general informational purposes only and is not a substitute for professional medical advice.",
  "Always consult with a qualified healthcare provider for medical advice, diagnosis, or treatment.",
  "If you are experiencing a medical emergency, call your local emergency services immediately.",
];

const DEFAULT_MEDICAL_SOURCES = [
  "Mayo Clinic",
  "Centers for Disease Control and Prevention (CDC)",
  "World Health Organization (WHO)",
  "National Institutes of Health (NIH)",
];

const initialState: ChatbotState = {
  sessions: [],
  currentSession: null,
  messages: [],
  loading: false,
  error: null,
  disclaimers: DEFAULT_DISCLAIMERS,
  medicalSources: DEFAULT_MEDICAL_SOURCES,
};

// Create a new chat session
export const createChatSession = createAsyncThunk(
  "chatbot/createSession",
  async () => {
    const response = await chatbotApi.createSession();
    return response.data;
  }
);

// Get all chat sessions for the current user
export const fetchChatSessions = createAsyncThunk(
  "chatbot/fetchSessions",
  async () => {
    const response = await chatbotApi.getSessions();
    return response.data;
  }
);

// Get a specific chat session with its messages
export const fetchChatSession = createAsyncThunk(
  "chatbot/fetchSession",
  async (sessionId: number) => {
    const response = await chatbotApi.getSession(sessionId);
    return response.data;
  }
);

// Send a message to the chatbot and get a response
export const sendMessage = createAsyncThunk(
  "chatbot/sendMessage",
  async ({ sessionId, content }: { sessionId: number; content: string }) => {
    const response = await chatbotApi.sendMessage(sessionId, { content });
    return {
      userMessage: {
        content,
        sender: "USER",
        timestamp: new Date().toISOString(),
      },
      botResponse: {
        content: response.data.response,
        sender: "BOT",
        timestamp: response.data.timestamp,
      },
    };
  }
);

// Get chat history for a session
export const fetchChatHistory = createAsyncThunk(
  "chatbot/fetchHistory",
  async (sessionId: number) => {
    const response = await chatbotApi.getChatHistory(sessionId);
    return response.data;
  }
);

// End a chat session
export const endChatSession = createAsyncThunk(
  "chatbot/endSession",
  async (sessionId: number) => {
    await chatbotApi.endSession(sessionId);
    return sessionId;
  }
);

// Get chatbot configuration
export const fetchChatbotConfig = createAsyncThunk(
  "chatbot/fetchConfig",
  async () => {
    const response = await chatbotApi.getConfig();
    return response.data;
  }
);

const chatbotSlice = createSlice({
  name: "chatbot",
  initialState,
  reducers: {
    clearCurrentSession: (state) => {
      state.currentSession = null;
      state.messages = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create session
      .addCase(createChatSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createChatSession.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSession = action.payload;
        state.sessions.push(action.payload);
        state.messages = [];
      })
      .addCase(createChatSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create chat session";
      })

      // Fetch sessions
      .addCase(fetchChatSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatSessions.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = action.payload;
      })
      .addCase(fetchChatSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch chat sessions";
      })

      // Fetch session
      .addCase(fetchChatSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatSession.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSession = action.payload;
        state.messages = action.payload.messages || [];
      })
      .addCase(fetchChatSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch chat session";
      })

      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push(action.payload.userMessage);
        state.messages.push(action.payload.botResponse);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to send message";
      })

      // Fetch chat history
      .addCase(fetchChatHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchChatHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch chat history";
      })

      // End session
      .addCase(endChatSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(endChatSession.fulfilled, (state, action) => {
        state.loading = false;
        const sessionId = action.payload;

        // Update the session in the sessions array
        const sessionIndex = state.sessions.findIndex(
          (s) => s.id === sessionId
        );
        if (sessionIndex !== -1) {
          state.sessions[sessionIndex].isActive = false;
          state.sessions[sessionIndex].endTime = new Date().toISOString();
        }

        // Update current session if it's the one being ended
        if (state.currentSession && state.currentSession.id === sessionId) {
          state.currentSession.isActive = false;
          state.currentSession.endTime = new Date().toISOString();
        }
      })
      .addCase(endChatSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to end chat session";
      })

      // Fetch config
      .addCase(fetchChatbotConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatbotConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.disclaimers = action.payload.disclaimers || [];
        state.medicalSources = action.payload.medicalSources || [];
      })
      .addCase(fetchChatbotConfig.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to fetch chatbot configuration";
      });
  },
});

export const { clearCurrentSession, clearError } = chatbotSlice.actions;
export default chatbotSlice.reducer;
