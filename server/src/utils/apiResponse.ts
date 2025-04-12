// src/utils/apiResponse.ts
export class APIError extends Error {
    constructor(
      public message: string,
      public status: number = 500,
      public code?: string
    ) {
      super(message);
    }
  }
  
  export const APIResponse = {
    success<T>(data: T, message: string = 'success') {
      return {
        status: 'success',
        message,
        data
      };
    },
  
    error(message: string, status: number = 500, code?: string) {
      throw new APIError(message, status, code);
    }
  };