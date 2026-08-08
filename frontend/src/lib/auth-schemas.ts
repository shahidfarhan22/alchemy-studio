import { z } from "zod";

// Password rule mirrors backend Program.cs Identity config (min length 10).
// Keep these in sync by hand until docs/api.md gives us a generated contract.
export const registerSchema = z.object({
  displayName: z.string().trim().min(1, "Enter your name"),
  email: z.email("Enter a valid email"),
  password: z.string().min(10, "Password must be at least 10 characters"),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
