import { redirect } from "next/navigation";

// DevPort uses GitHub OAuth only — no email sign up
export default function SignUpPage() {
  redirect("/sign-in");
}
