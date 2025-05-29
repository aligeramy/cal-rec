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
  {
    id: 'business-consultation',
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
  },
  {
    id: 'job-interview',
    name: 'Job Interview',
    description: 'A professional job interview session',
    duration: 45,
    prompt: `Generate a realistic job interview conversation between a candidate and an interviewer.

The conversation should:
- Be professional but conversational
- Include typical interview questions and responses
- Have the interviewer asking about experience, skills, and scenarios
- Include the candidate asking questions about the role and company
- Be approximately 45 minutes long when spoken
- Have natural conversation flow with follow-up questions
- Include some technical or role-specific discussions

Client/Candidate (Speaker 0): Should be answering questions, asking about the role, showing interest
Host/Interviewer (Speaker 1): Should be asking questions, explaining the role, evaluating the candidate

Make it realistic with natural conversation patterns.`,
  },
  {
    id: 'sales-call',
    name: 'Sales Call',
    description: 'A sales discovery and presentation call',
    duration: 25,
    prompt: `Generate a realistic sales call conversation between a potential client and a sales representative.

The conversation should:
- Start with rapport building and discovery
- Include needs assessment and pain point identification
- Have the sales rep presenting solutions
- Include objection handling and questions
- Be approximately 25 minutes long when spoken
- Feel natural with real sales conversation dynamics
- Include pricing discussions and next steps

Client/Prospect (Speaker 0): Should have business needs, ask questions, raise some objections
Host/Sales Rep (Speaker 1): Should be discovering needs, presenting solutions, handling objections

Make it feel like a real sales conversation with natural flow.`,
  },
  {
    id: 'team-standup',
    name: 'Team Standup',
    description: 'A daily team standup meeting',
    duration: 15,
    prompt: `Generate a realistic team standup meeting conversation between team members.

The conversation should:
- Be a quick daily standup format
- Include updates on what was done, what's planned, and any blockers
- Have multiple team members participating (but focus on 2 main speakers)
- Be approximately 15 minutes long when spoken
- Include project updates, technical discussions, and coordination
- Feel like a real development/project team meeting

Client/Team Member (Speaker 0): Should give updates, mention blockers, ask for help
Host/Team Lead (Speaker 1): Should facilitate, ask follow-ups, provide guidance

Make it realistic with typical team dynamics and project discussions.`,
  },
  {
    id: 'customer-support',
    name: 'Customer Support',
    description: 'A customer support troubleshooting call',
    duration: 20,
    prompt: `Generate a realistic customer support conversation between a customer and a support representative.

The conversation should:
- Start with the customer explaining their issue
- Include troubleshooting steps and questions
- Have the support rep being helpful and professional
- Include technical problem-solving
- Be approximately 20 minutes long when spoken
- Feel like a real support call with problem resolution
- Include verification steps and follow-up

Client/Customer (Speaker 0): Should explain problems, ask questions, follow instructions
Host/Support Rep (Speaker 1): Should be helpful, ask clarifying questions, provide solutions

Make it realistic with typical support call dynamics and resolution.`,
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