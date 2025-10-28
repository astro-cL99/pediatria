import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { DefaultSession, NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Extender la interfaz de sesión para incluir el rol del usuario
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  // Configurar el adaptador de Prisma
  adapter: PrismaAdapter(prisma),
  
  // Configurar proveedores de autenticación
  providers: [
    // Proveedor de credenciales (email/contraseña)
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Por favor ingresa tu correo y contraseña");
        }

        // Buscar usuario por email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // Verificar si el usuario existe y la contraseña es correcta
        if (!user || !user.password) {
          throw new Error("Credenciales inválidas");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Credenciales inválidas");
        }

        // Retornar el usuario sin la contraseña
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      },
    }),
  ],
  
  // Configuración de la sesión
  session: {
    strategy: "jwt",
  },
  
  // Callbacks para personalizar los tokens y las sesiones
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  
  // Páginas personalizadas
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  
  // Configuración de depuración
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
