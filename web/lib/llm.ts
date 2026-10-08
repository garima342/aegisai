export interface LLMResponse {
  status: string;
  content: string;
}

export class LLMClient {
  private mode: string;

  constructor() {
    this.mode = process.env.LLM_MODE || 'mock';
  }

  async generateResponse(prompt: string): Promise<LLMResponse> {
    if (this.mode === 'mock') {
      return {
        status: 'success',
        content: `MOCK RESPONSE for prompt: ${prompt.substring(0, 20)}...`
      };
    } else {
      // Live LLM call placeholder
      return {
        status: 'success',
        content: 'Live response placeholder.'
      };
    }
  }
}
