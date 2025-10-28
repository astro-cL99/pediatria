import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth/next";
import { NextAuthOptions } from "next-auth";

export { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const getCurrentUser = async () => {
  const session = await getServerSession(authOptions as unknown as NextAuthOptions);
  return session?.user;
};

export const getCurrentRole = async () => {
  const user = await getCurrentUser();
  return user?.role;
};

export const requireAuth = async () => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("No autorizado");
  }
  return user;
};

export const requireRole = async (role: string) => {
  const user = await getCurrentUser();
  if (user?.role !== role) {
    throw new Error("No tienes permisos para realizar esta acción");
  }
  return user;
};
