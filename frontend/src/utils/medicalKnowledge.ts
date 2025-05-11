/**
 * Simple medical knowledge base for fallback responses when the backend is unavailable
 */

interface MedicalInfo {
  condition: string;
  description: string;
  symptoms: string[];
  preventiveMeasures: string[];
  whenToSeeDoctor: string;
}

const medicalKnowledgeBase: Record<string, MedicalInfo> = {
  headache: {
    condition: "Headache",
    description:
      "Headaches are pain in any region of the head. They may occur on one or both sides of the head, be isolated to a certain location, radiate across the head, or have a viselike quality.",
    symptoms: [
      "Pain in the head or face",
      "Throbbing or constant pain",
      "Pain on one or both sides",
      "Sensitivity to light or sound",
      "Nausea or vomiting (in severe cases)",
    ],
    preventiveMeasures: [
      "Stay hydrated",
      "Get adequate sleep",
      "Manage stress",
      "Maintain regular physical activity",
      "Avoid known triggers (certain foods, alcohol, etc.)",
    ],
    whenToSeeDoctor:
      "See a doctor if you have severe headaches, headaches that wake you from sleep, headaches with fever, stiff neck, confusion, or headaches after a head injury.",
  },

  cold: {
    condition: "Common Cold",
    description:
      "The common cold is a viral infection of your nose and throat (upper respiratory tract). It's usually harmless, although it might not feel that way.",
    symptoms: [
      "Runny or stuffy nose",
      "Sore throat",
      "Cough",
      "Congestion",
      "Slight body aches or a mild headache",
      "Sneezing",
      "Low-grade fever",
      "Generally feeling unwell",
    ],
    preventiveMeasures: [
      "Wash your hands frequently",
      "Avoid close contact with anyone who has a cold",
      "Keep your hands away from your eyes, nose and mouth",
      "Clean and disinfect surfaces",
      "Strengthen your immune system with a healthy diet and regular exercise",
    ],
    whenToSeeDoctor:
      "See a doctor if symptoms last more than 10 days, you have a high fever, or symptoms are severe or unusual.",
  },

  flu: {
    condition: "Influenza (Flu)",
    description:
      "Influenza is a viral infection that attacks your respiratory system — your nose, throat and lungs. Influenza is commonly called the flu.",
    symptoms: [
      "Fever over 100.4°F (38°C)",
      "Aching muscles",
      "Chills and sweats",
      "Headache",
      "Dry, persistent cough",
      "Shortness of breath",
      "Tiredness and weakness",
      "Runny or stuffy nose",
      "Sore throat",
      "Eye pain",
      "Vomiting and diarrhea (more common in children)",
    ],
    preventiveMeasures: [
      "Get a flu vaccine every year",
      "Wash your hands",
      "Contain your coughs and sneezes",
      "Avoid crowds during flu season",
      "Strengthen your immune system with healthy habits",
    ],
    whenToSeeDoctor:
      "Seek medical attention if you have difficulty breathing, persistent chest pain, ongoing dizziness, seizures, severe weakness, or worsening of existing medical conditions.",
  },

  diabetes: {
    condition: "Diabetes",
    description:
      "Diabetes is a disease that occurs when your blood glucose, also called blood sugar, is too high. Blood glucose is your main source of energy and comes from the food you eat.",
    symptoms: [
      "Increased thirst",
      "Frequent urination",
      "Extreme hunger",
      "Unexplained weight loss",
      "Fatigue",
      "Irritability",
      "Blurred vision",
      "Slow-healing sores",
      "Frequent infections",
    ],
    preventiveMeasures: [
      "Maintain a healthy weight",
      "Be physically active",
      "Eat a balanced diet with plenty of fiber",
      "Avoid sugary foods and refined carbohydrates",
      "Quit smoking",
      "Limit alcohol consumption",
    ],
    whenToSeeDoctor:
      "See a doctor if you notice any of the symptoms of diabetes. Early diagnosis and treatment can prevent complications.",
  },

  hypertension: {
    condition: "Hypertension (High Blood Pressure)",
    description:
      "Hypertension is a common condition in which the long-term force of the blood against your artery walls is high enough that it may eventually cause health problems, such as heart disease.",
    symptoms: [
      "Most people have no symptoms, even if blood pressure readings reach dangerously high levels",
      "Some people may have headaches",
      "Shortness of breath",
      "Nosebleeds",
    ],
    preventiveMeasures: [
      "Eat a healthy diet with less salt",
      "Maintain a healthy weight",
      "Be physically active",
      "Limit alcohol consumption",
      "Don't smoke",
      "Manage stress",
      "Monitor your blood pressure regularly",
    ],
    whenToSeeDoctor:
      "Have your blood pressure checked at least every two years if it's normal, or more frequently if it's elevated or if you have other risk factors for heart disease.",
  },
};

/**
 * Get information about a medical condition
 * @param query The search query
 * @returns Information about the condition or null if not found
 */
export const getMedicalInfo = (query: string): MedicalInfo | null => {
  // Convert query to lowercase for case-insensitive matching
  const lowerQuery = query.toLowerCase();

  // Check for exact matches
  if (medicalKnowledgeBase[lowerQuery]) {
    return medicalKnowledgeBase[lowerQuery];
  }

  // Check for partial matches
  for (const [key, info] of Object.entries(medicalKnowledgeBase)) {
    if (lowerQuery.includes(key)) {
      return info;
    }
  }

  // Check if any condition name is in the query
  for (const [key, info] of Object.entries(medicalKnowledgeBase)) {
    if (lowerQuery.includes(info.condition.toLowerCase())) {
      return info;
    }
  }

  // Check if any symptom is in the query
  for (const [key, info] of Object.entries(medicalKnowledgeBase)) {
    for (const symptom of info.symptoms) {
      if (lowerQuery.includes(symptom.toLowerCase())) {
        return info;
      }
    }
  }

  return null;
};

/**
 * Format medical information into a readable response
 * @param info The medical information
 * @returns A formatted string with the information
 */
export const formatMedicalResponse = (info: MedicalInfo): string => {
  // Create a simpler, more compact response that will display better in the chat
  let response = `Here's information about ${info.condition}:\n\n`;

  response += `${info.description}\n\n`;

  response += "Common Symptoms:\n";
  info.symptoms.forEach((symptom) => {
    response += `• ${symptom}\n`;
  });

  response += "\nPreventive Measures:\n";
  info.preventiveMeasures.forEach((measure) => {
    response += `• ${measure}\n`;
  });

  response += `\nWhen to See a Doctor:\n${info.whenToSeeDoctor}\n\n`;

  // Add a separator line before the disclaimer
  response += "---\n";
  response +=
    "DISCLAIMER: This information is for educational purposes only and is not a substitute for professional medical advice. Always consult with a qualified healthcare provider for medical advice, diagnosis, or treatment.";

  // Log the formatted response for debugging
  console.log("Formatted medical response:", response);

  return response;
};

/**
 * Generate a response based on a medical query
 * @param query The user's query
 * @returns A response to the query
 */
export const generateMedicalResponse = (query: string): string => {
  const info = getMedicalInfo(query);

  if (info) {
    return formatMedicalResponse(info);
  }

  // Generic responses for common medical questions
  if (
    query.toLowerCase().includes("symptom") ||
    query.toLowerCase().includes("sign")
  ) {
    return "About symptoms in general:\n\nSymptoms can vary widely depending on the condition. It's important to consult with a healthcare provider for proper diagnosis. Can you tell me more about the specific symptoms you're concerned about?\n\n---\nDISCLAIMER: This information is for educational purposes only and is not a substitute for professional medical advice.";
  }

  if (
    query.toLowerCase().includes("treatment") ||
    query.toLowerCase().includes("cure") ||
    query.toLowerCase().includes("medicine")
  ) {
    return "About treatments in general:\n\nTreatment options depend on the specific condition, its severity, and individual factors. It's best to consult with a healthcare provider for personalized treatment recommendations.\n\n---\nDISCLAIMER: This information is for educational purposes only and is not a substitute for professional medical advice.";
  }

  if (
    query.toLowerCase().includes("prevent") ||
    query.toLowerCase().includes("avoid")
  ) {
    return "About prevention in general:\n\nGeneral preventive measures for many health conditions include:\n• Maintaining a healthy diet\n• Regular physical activity\n• Adequate sleep\n• Stress management\n• Avoiding tobacco\n• Limiting alcohol\n\nFor specific conditions, please consult with a healthcare provider.\n\n---\nDISCLAIMER: This information is for educational purposes only and is not a substitute for professional medical advice.";
  }

  // Default response
  return "I don't have specific information about that in my knowledge base. For accurate medical advice, please consult with a healthcare professional.\n\n---\nDISCLAIMER: This information is for educational purposes only and is not a substitute for professional medical advice.";
};

export default generateMedicalResponse;
