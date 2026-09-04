import { redirect } from "next/navigation";
import { hasAdminSession } from "@/app/admin-auth";
import EmployeesPanel from "./panel";
export const dynamic = "force-dynamic";
export default async function EmployeesPage() { if (!(await hasAdminSession())) redirect("/admin/login"); return <EmployeesPanel />; }
