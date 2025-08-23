import type { Request, Response } from "express";

export const signup = async (req: Request, res: Response) => {
  res.send("signup route");
};

export const login = async (req: Request, res: Response) => {
  res.send("login route");
};

export const logout = async (req: Request, res: Response) => {
  res.send("logout route");
};
