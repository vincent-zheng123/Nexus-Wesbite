import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role: "ADMIN" | "CLIENT";
    clientId?: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "ADMIN" | "CLIENT";
      clientId?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "ADMIN" | "CLIENT";
    clientId?: string;
  }
}
