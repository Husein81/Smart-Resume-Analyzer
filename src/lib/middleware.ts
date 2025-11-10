import { getServerSession, Session } from "next-auth";
import { authOptions } from "./auth";

export const isAuthenticated = async (): Promise<Session | undefined> => {
  const session = await getServerSession(authOptions);

  if (!session) {
    return undefined;
  }

  return session;
};
