import { redirect } from "next/navigation";

export const metadata = {
  title: "Operator Demo",
};

export default function DemoOperatorPage() {
  redirect("/demo#sandbox-title");
}
