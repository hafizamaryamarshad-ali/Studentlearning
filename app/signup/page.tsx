import { redirect } from "next/navigation";
export default async function SignupPage() {
  redirect("/learn?next=/courses");
}
