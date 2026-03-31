import { redirect } from "next/navigation";

// Root always goes to dashboard - this is a local tool, not a website
export default function RootPage() {
  redirect("/dashboard");
}
