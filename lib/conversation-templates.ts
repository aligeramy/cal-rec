export interface ConversationTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  duration: number; // in minutes
  clientName?: string;
  hostName?: string;
}

export const conversationTemplates: ConversationTemplate[] = [
  { id: 'narcan-consultation',
    name: 'Narcan Consultation',
    description: 'A professional Narcan consultation meeting',
    duration: 30,
    prompt: `Generate a realistic Narcan consultation conversation between a client and a pharmacist. 

The conversation should:
- Be professional and natural
- Include discussion about business challenges, goals, and solutions
- Have the consultant asking probing questions
- Include specific business scenarios and advice
- Be approximately 30 minutes long when spoken
- Have natural pauses, interruptions, and conversational flow
- Include filler words like "um", "uh", "you know" occasionally for realism

Client (Speaker 0): Should be seeking advice, asking questions, explaining their business situation
Host/Consultant (Speaker 1): Should be professional, asking clarifying questions, providing guidance

Make it feel like a real conversation with natural back-and-forth dialogue.`,
  }
];

export function getTemplateById(id: string): ConversationTemplate | undefined {
  return conversationTemplates.find(template => template.id === id);
}

export function getTemplateNames(): { id: string; name: string; description: string }[] {
  return conversationTemplates.map(template => ({
    id: template.id,
    name: template.name,
    description: template.description
  }));
} 