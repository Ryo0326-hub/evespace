import { redirect } from "next/navigation";

export default function NewDashboardEventPage() {
  redirect("/admin/official-events/new");
}
