import React, { useState, useEffect } from "react";
import { Fab, Tooltip, Badge, useTheme, useMediaQuery } from "@mui/material";
import { ChatBubble as ChatIcon } from "@mui/icons-material";
import ChatbotDialog from "./ChatbotDialog";
import PrivacyNotice from "./PrivacyNotice";
import { styled } from "@mui/material/styles";

const StyledFab = styled(Fab)(({ theme }) => ({
  position: "fixed",
  bottom: theme.spacing(4),
  right: theme.spacing(4),
  zIndex: 1000,
}));

const PRIVACY_ACCEPTED_KEY = "chatbot_privacy_accepted";

const ChatbotButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Check if user has already accepted the privacy notice
  useEffect(() => {
    const hasAccepted = localStorage.getItem(PRIVACY_ACCEPTED_KEY) === "true";
    if (!hasAccepted) {
      setShowPrivacyNotice(true);
    }
  }, []);

  const handleOpen = () => {
    const hasAccepted = localStorage.getItem(PRIVACY_ACCEPTED_KEY) === "true";
    if (hasAccepted) {
      setOpen(true);
    } else {
      setShowPrivacyNotice(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handlePrivacyClose = () => {
    setShowPrivacyNotice(false);
  };

  const handlePrivacyAccept = () => {
    localStorage.setItem(PRIVACY_ACCEPTED_KEY, "true");
    setShowPrivacyNotice(false);
    setOpen(true);
  };

  return (
    <>
      <Tooltip title="Healthcare Assistant" placement="left">
        <StyledFab
          color="primary"
          aria-label="chat"
          onClick={handleOpen}
          size={isMobile ? "medium" : "large"}
        >
          <Badge color="secondary" variant="dot">
            <ChatIcon />
          </Badge>
        </StyledFab>
      </Tooltip>

      <ChatbotDialog open={open} onClose={handleClose} />

      <PrivacyNotice
        open={showPrivacyNotice}
        onClose={handlePrivacyClose}
        onAccept={handlePrivacyAccept}
      />
    </>
  );
};

export default ChatbotButton;
