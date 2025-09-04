import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import User, { type IUser } from "../models/user.model.js";

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// middleware to check if user is authenticated
export const protectedRoute = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // take access token from cookies
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No access token provided" });
    }

    try {
      // verify access token and get user from database
      const decoded = jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET!
      ) as JwtPayload;
      const user = await User.findById(decoded.userId).select("-password"); // select all fields except password

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // attach user to request
      req.user = user;
      next(); // call next middleware
    } catch (error) {
      if (error instanceof Error && error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Access token expired" });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error verifying access token:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({ message });
  }
};

// middleware to check if user is admin
export const adminRoute = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Acess denied - Admin only" });
  }
};
