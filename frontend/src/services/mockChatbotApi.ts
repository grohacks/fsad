/**
 * Mock implementation of the chatbot API for testing purposes
 * This can be used when the backend is not available or for development
 */

import { ChatMessage, ChatSession } from "../store/slices/chatbotSlice";

// Sample medical knowledge for common conditions
const medicalKnowledge: Record<string, string> = {
  "headache": "Headaches can be caused by various factors including stress, dehydration, lack of sleep, or underlying medical conditions. For occasional headaches, rest, hydration, and over-the-counter pain relievers may help. If headaches are severe or persistent, consult a healthcare provider.",
  
  "fever": "Fever is usually a sign that your body is fighting an infection. Rest, staying hydrated, and taking fever-reducing medications can help manage symptoms. If fever is high (above 103°F/39.4°C), persists for more than three days, or is accompanied by severe symptoms, seek medical attention.",
  
  "cold": "The common cold is a viral infection affecting the upper respiratory tract. Symptoms include runny nose, congestion, sore throat, and cough. Treatment focuses on relieving symptoms with rest, hydration, and over-the-counter medications. Most colds resolve within 7-10 days.",
  
  "flu": "Influenza (flu) is a contagious respiratory illness caused by influenza viruses. Symptoms include fever, cough, sore throat, body aches, and fatigue. Antiviral medications may be prescribed if diagnosed early. Annual flu vaccination is recommended for prevention.",
  
  "diabetes": "Diabetes is a chronic condition affecting how your body processes blood sugar. Type 1 diabetes requires insulin therapy, while Type 2 diabetes may be managed with lifestyle changes, oral medications, or insulin. Regular monitoring of blood glucose levels is essential for management.",
  
  "hypertension": "Hypertension (high blood pressure) often has no symptoms but can lead to serious health problems if untreated. Management includes regular exercise, healthy diet low in sodium, maintaining healthy weight, limiting alcohol, not smoking, and sometimes medication.",
  
  "covid": "COVID-19 is caused by the SARS-CoV-2 virus. Symptoms vary but may include fever, cough, shortness of breath, fatigue, and loss of taste or smell. If you suspect COVID-19, get tested and follow isolation guidelines. Vaccines are available to prevent severe illness.",
};

// Default disclaimers
const disclaimers = [
  "The information provided is for general informational purposes only and is not a substitute for professional medical advice.",
  "Always consult with a qualified healthcare provider for medical advice, diagnosis, or treatment.",
  "If you are experiencing a medical emergency, call your local emergency services immediately.",
];

// Default medical sources
const medicalSources = [
  "Mayo Clinic",
  "Centers for Disease Control and Prevention (CDC)",
  "World Health Organization (WHO)",
  "National Institutes of Health (NIH)",
];

// Mock session storage
let sessions: ChatSession[] = [];
let messages: Record<number, ChatMessage[]> = {};
let nextSessionId = 1;
let nextMessageId = 1;

// Helper function to generate a response based on user input
const generateResponse = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  // Check for greetings
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    return "Hello! I'm your healthcare assistant. How can I help you today?";
  }
  
  // Check for thanks
  if (lowerMessage.includes("thank")) {
    return "You're welcome! Is there anything else I can help you with?";
  }
  
  // Check for medical conditions in our knowledge base
  for (const [condition, info] of Object.entries(medicalKnowledge)) {
    if (lowerMessage.includes(condition)) {
      return `${info}\n\nDISCLAIMER: This information is for educational purposes only and is not a substitute for professional medical advice.`;
    }
  }
  
  // Check for questions about symptoms
  if (lowerMessage.includes("symptom")) {
    return "Symptoms can vary widely depending on the condition. It's important to consult with a healthcare provider for proper diagnosis. Can you tell me more about the specific symptoms you're concerned about?";
  }
  
  // Check for questions about treatment
  if (lowerMessage.includes("treatment") || lowerMessage.includes("cure")) {
    return "Treatment options depend on the specific condition, its severity, and individual factors. It's best to consult with a healthcare provider for personalized treatment recommendations.";
  }
  
  // Default response
  return "I don't have specific information about that. For accurate medical advice, please consult with a healthcare professional. Is there something else I can help you with?";
};

// Mock API implementation
export const mockChatbotApi = {
  createSession: async () => {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newSession: ChatSession = {
        id: nextSessionId++,
        startTime: new Date().toISOString(),
        isActive: true,
      };
      
      sessions.push(newSession);
      messages[newSession.id] = [];
      
      return { data: newSession };
    } catch (error) {
      console.error("Mock API - Error creating session:", error);
      throw error;
    }
  },
  
  getSessions: async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: sessions };
  },
  
  getSession: async (sessionId: number) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    
    return { data: { ...session, messages: messages[sessionId] || [] } };
  },
  
  sendMessage: async (sessionId: number, message: { content: string }) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    
    // Add user message to history
    const userMessage: ChatMessage = {
      id: nextMessageId++,
      content: message.content,
      sender: "USER",
      timestamp: new Date().toISOString(),
    };
    
    messages[sessionId].push(userMessage);
    
    // Generate bot response
    const responseContent = generateResponse(message.content);
    const botResponseTime = new Date();
    
    // Add bot message to history
    const botMessage: ChatMessage = {
      id: nextMessageId++,
      content: responseContent,
      sender: "BOT",
      timestamp: botResponseTime.toISOString(),
    };
    
    messages[sessionId].push(botMessage);
    
    // Update session last activity time
    session.lastActivityTime = botResponseTime.toISOString();
    
    return { 
      data: {
        response: responseContent,
        timestamp: botResponseTime.toISOString(),
      }
    };
  },
  
  getChatHistory: async (sessionId: number) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!messages[sessionId]) {
      throw new Error("Session not found");
    }
    
    return { data: messages[sessionId] };
  },
  
  endSession: async (sessionId: number) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    
    session.isActive = false;
    session.endTime = new Date().toISOString();
    
    return { data: { message: "Chat session ended successfully" } };
  },
  
  getConfig: async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { 
      data: {
        disclaimers,
        medicalSources,
      }
    };
  },
};

export default mockChatbotApi;
