import { redirect } from "next/navigation";
import { hasAdminSession } from "../admin-auth";
import AdminPanel from "./panel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await hasAdminSession())) redirect("/admin/login");
  return <AdminPanel />;
}
