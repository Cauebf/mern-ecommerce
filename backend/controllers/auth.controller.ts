import type { Request, Response } from "express";
import User from "../models/user.model.js";

export const signup = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({ user, message: "User created successfully" });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: error.message });
    } else {
      console.error("Unexpected error:", error);
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  }
};

export const login = async (req: Request, res: Response) => {
  res.send("login route");
};

export const logout = async (req: Request, res: Response) => {
  res.send("logout route");
};
