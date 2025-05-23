import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }

  // This won't be reached, but is needed for TypeScript
  return null;
}
