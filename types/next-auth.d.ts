import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      wallet?: string;
      username?: string;
      level?: number;
      xp?: number;
    };
  }
}
