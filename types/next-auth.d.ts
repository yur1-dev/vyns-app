// types/next-auth.d.ts
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      wallet?: string | null;
      username?: string | null;
      level?: number;
      xp?: number;
      isNewUser?: boolean;
    };
  }

  interface User {
    id: string;
    wallet?: string | null;
    isNewUser?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    wallet?: string | null;
    isNewUser?: boolean;
  }
}
