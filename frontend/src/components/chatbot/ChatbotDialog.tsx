import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Divider,
  CircularProgress,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Alert,
} from "@mui/material";
import {
  Close as CloseIcon,
  Send as SendIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  MedicalServices as MedicalServicesIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useChatbot } from "../../hooks/useChatbot";
import { styled } from "@mui/material/styles";
import { ChatMessage } from "../../store/slices/chatbotSlice";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: "10px",
  maxWidth: "80%",
}));

const UserMessage = styled(StyledPaper)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.contrastText,
  alignSelf: "flex-end",
}));

const BotMessage = styled(StyledPaper)(({ theme }) => ({
  backgroundColor: theme.palette.grey[100],
  alignSelf: "flex-start",
  whiteSpace: "pre-line", // Preserve line breaks
  "& ul, & ol": {
    paddingLeft: theme.spacing(2),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  "& li": {
    marginBottom: theme.spacing(0.5),
  },
}));

const MessageContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  overflowY: "auto",
  height: "400px",
  padding: "10px",
});

interface ChatbotDialogProps {
  open: boolean;
  onClose: () => void;
}

const ChatbotDialog: React.FC<ChatbotDialogProps> = ({ open, onClose }) => {
  const {
    currentSession,
    messages,
    loading,
    error,
    disclaimers,
    medicalSources,
    createSession,
    sendChatMessage,
    getConfig,
    resetError,
  } = useChatbot();

  const [input, setInput] = useState("");
  const [showDisclaimers, setShowDisclaimers] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [initializationFailed, setInitializationFailed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create a new session when the dialog opens
  useEffect(() => {
    if (open) {
      setInitializationFailed(false);
      const initChat = async () => {
        try {
          console.log("Initializing chat session...");
          const sessionCreated = await createSession();
          console.log("Session created:", sessionCreated);

          if (sessionCreated) {
            const configLoaded = await getConfig();
            console.log("Config loaded:", configLoaded);
            setInitializationFailed(false);
          } else {
            console.error("Failed to create chat session");
            setInitializationFailed(true);
          }
        } catch (error) {
          console.error("Error initializing chat:", error);
          setInitializationFailed(true);
        }
      };
      initChat();
    }
  }, [open, createSession, getConfig]);

  // Function to retry session creation
  const handleRetryInitialization = async () => {
    setInitializationFailed(false);
    try {
      console.log("Retrying chat session initialization...");
      const sessionCreated = await createSession();

      if (sessionCreated) {
        await getConfig();
        console.log("Session created successfully on retry");
      } else {
        console.error("Failed to create chat session on retry");
        setInitializationFailed(true);
      }
    } catch (error) {
      console.error("Error retrying chat initialization:", error);
      setInitializationFailed(true);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        resetError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, resetError]);

  const handleSendMessage = async () => {
    if (!input.trim() || !currentSession) return;

    const message = input.trim();
    setInput("");

    if (currentSession) {
      await sendChatMessage(currentSession.id, message);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const MessageComponent =
      message.sender === "USER" ? UserMessage : BotMessage;

    // For user messages, simple display
    if (message.sender === "USER") {
      return (
        <MessageComponent key={index}>
          <Typography variant="body1">{message.content}</Typography>
          <Typography
            variant="caption"
            sx={{ display: "block", textAlign: "right", mt: 1 }}
          >
            {formatTimestamp(message.timestamp)}
          </Typography>
        </MessageComponent>
      );
    }

    // For bot messages, handle formatting more carefully
    // Check if the message contains ONLY a disclaimer and nothing else
    const isOnlyDisclaimer =
      message.content.trim().startsWith("DISCLAIMER:") &&
      message.content.trim().split("\n").length <= 2; // Only 1-2 lines

    if (isOnlyDisclaimer) {
      console.warn("Message contains only disclaimer:", message.content);
      return (
        <MessageComponent key={index}>
          <Typography variant="body2" color="textSecondary">
            I'm sorry, I couldn't find specific information about that. Please
            try asking in a different way.
          </Typography>
          <Typography
            variant="caption"
            sx={{ display: "block", textAlign: "right", mt: 1 }}
          >
            {formatTimestamp(message.timestamp)}
          </Typography>
        </MessageComponent>
      );
    }

    // Process the message content to handle newlines
    const formattedContent = message.content.split("\n").map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < message.content.split("\n").length - 1 && <br />}
      </React.Fragment>
    ));

    return (
      <MessageComponent key={index}>
        <Typography
          variant="body1"
          component="div"
          sx={{ whiteSpace: "pre-line" }}
        >
          {formattedContent}
        </Typography>
        <Typography
          variant="caption"
          sx={{ display: "block", textAlign: "right", mt: 1 }}
        >
          {formatTimestamp(message.timestamp)}
        </Typography>
      </MessageComponent>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, height: "600px" },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <MedicalServicesIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Healthcare Assistant</Typography>
        </Box>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      {error && (
        <Alert severity="error" sx={{ mx: 2, mt: 2 }}>
          {error}
        </Alert>
      )}

      <DialogContent sx={{ p: 2 }}>
        <MessageContainer>
          {messages.length === 0 ? (
            <Box sx={{ textAlign: "center", mt: 10 }}>
              <Typography variant="body1" color="textSecondary">
                Hello! I'm your healthcare assistant. How can I help you today?
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                You can ask me about:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• Information about medical conditions and symptoms" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Preventive measures and precautions" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• General health questions" />
                </ListItem>
              </List>
            </Box>
          ) : (
            messages.map(renderMessage)
          )}

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          <div ref={messagesEndRef} />
        </MessageContainer>
      </DialogContent>

      <Box sx={{ px: 2, pb: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Tooltip title="View medical disclaimers">
            <Button
              size="small"
              startIcon={
                showDisclaimers ? <ExpandLessIcon /> : <ExpandMoreIcon />
              }
              onClick={() => setShowDisclaimers(!showDisclaimers)}
            >
              Disclaimers
            </Button>
          </Tooltip>

          <Tooltip title="View medical information sources">
            <Button
              size="small"
              startIcon={showSources ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowSources(!showSources)}
            >
              Sources
            </Button>
          </Tooltip>
        </Box>

        <Collapse in={showDisclaimers}>
          <Paper variant="outlined" sx={{ p: 1, mb: 1 }}>
            <Typography variant="caption" color="textSecondary">
              <InfoIcon
                fontSize="small"
                sx={{ verticalAlign: "middle", mr: 0.5 }}
              />
              <strong>Medical Disclaimers:</strong>
            </Typography>
            <List dense>
              {disclaimers.map((disclaimer, index) => (
                <ListItem key={index} sx={{ py: 0 }}>
                  <ListItemText
                    primary={`• ${disclaimer}`}
                    primaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Collapse>

        <Collapse in={showSources}>
          <Paper variant="outlined" sx={{ p: 1, mb: 1 }}>
            <Typography variant="caption" color="textSecondary">
              <InfoIcon
                fontSize="small"
                sx={{ verticalAlign: "middle", mr: 0.5 }}
              />
              <strong>Medical Information Sources:</strong>
            </Typography>
            <List dense>
              {medicalSources.map((source, index) => (
                <ListItem key={index} sx={{ py: 0 }}>
                  <ListItemText
                    primary={`• ${source}`}
                    primaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Collapse>
      </Box>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        {loading && !currentSession ? (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              py: 1,
            }}
          >
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography variant="body2">
              Initializing chat session...
            </Typography>
          </Box>
        ) : initializationFailed ? (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 1,
            }}
          >
            <Typography variant="body2" color="error" sx={{ mb: 1 }}>
              Failed to initialize chat session
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleRetryInitialization}
              startIcon={<RefreshIcon />}
              disabled={loading}
            >
              Retry Connection
            </Button>
          </Box>
        ) : (
          <TextField
            fullWidth
            variant="outlined"
            placeholder={
              currentSession
                ? "Type your health question here..."
                : "Chat session initialization failed. Please try again."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading || !currentSession}
            error={!loading && !currentSession}
            helperText={
              !loading && !currentSession && !initializationFailed
                ? "Could not initialize chat session. Please close and reopen the chat."
                : ""
            }
            multiline
            maxRows={3}
            InputProps={{
              endAdornment: (
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!input.trim() || loading || !currentSession}
                >
                  <SendIcon />
                </IconButton>
              ),
            }}
          />
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ChatbotDialog;
