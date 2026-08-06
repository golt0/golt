declare global {
  namespace Express {
    interface Request {
      userId: string;
      ownerId : string
    }
  }
}

export {}