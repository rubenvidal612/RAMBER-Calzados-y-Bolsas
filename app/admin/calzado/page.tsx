import { redirect } from "next/navigation";
import { hasAdminSession } from "../../admin-auth";
import ShoeAlbumPanel from "./panel";
export const dynamic = "force-dynamic";
export default async function ShoeAlbumPage() { if (!(await hasAdminSession())) redirect("/admin/login"); return <ShoeAlbumPanel />; }
