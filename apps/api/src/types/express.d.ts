
import "express";

declare global {
  namespace Express {
    interface AdminUser {
      id: string;
      email: string;
      name: string;
    }

    interface Request {
      admin?: AdminUser;
    }
  }
}

export {};
