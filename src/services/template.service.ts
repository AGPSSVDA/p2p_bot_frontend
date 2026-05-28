import api from "@/lib/axios";

export interface TemplateMessage {
  id?: number; 
  message_text: string;
  step_order: number;
}

export interface Template {
  id: number;
  template_key: string;
  small_description?: string;
  messages: TemplateMessage[];
}

export interface TemplateResponse {
  success: boolean;
  message: string;
  data: Template[];
}

export interface TemplateVariable {
  token: string;        // e.g. "{pan}" — the exact text to insert
  name: string;         // e.g. "pan"
  example: string;      // e.g. "ABCDE1234F"
  description: string;
}

export interface VariablesResponse {
  success: boolean;
  message: string;
  data: TemplateVariable[];
}

export const templateService = {
  getTemplates: async (): Promise<TemplateResponse> => {
    const response = await api.get<TemplateResponse>("/templates");
    return response.data;
  },

  // Global variable palette — every variable usable in ANY template.
  getVariables: async (): Promise<VariablesResponse> => {
    const response = await api.get<VariablesResponse>("/templates/variables");
    return response.data;
  },
  
  // Use POST for blocks with NEW messages (no IDs)
  createTemplates: async (templateKey: string, messages: TemplateMessage[]) => {
    const response = await api.post("/templates", {
      template_key: templateKey,
      messages: messages
    });
    return response.data;
  },

  // Use PUT for reordering/editing EXISTING messages
  updateTemplates: async (templateKey: string, messages: TemplateMessage[]) => {
    const response = await api.put("/templates", {
      template_key: templateKey,
      messages: messages
    });
    return response.data;
  },

  deleteMessage: async (messageId: number) => {
    const response = await api.delete(`/templates/${messageId}`);
    return response.data;
  }
};
