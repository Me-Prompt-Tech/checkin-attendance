import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      forcePasswordChange: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    forcePasswordChange: boolean;
  }
}
