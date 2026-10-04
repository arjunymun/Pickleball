import { redirect } from "next/navigation";

export const metadata = {
  title: "Customer Demo",
};

export default function DemoCustomerPage() {
  redirect("/demo#sandbox-title");
}
