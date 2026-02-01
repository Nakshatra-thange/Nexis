export class AppError extends Error {
    code: string;
    userMessage: string;
    status?: number;
  
    constructor(code: string, userMessage: string, status = 400) {
      super(userMessage);
      this.code = code;
      this.userMessage = userMessage;
      this.status = status;
    }
    
  }
  