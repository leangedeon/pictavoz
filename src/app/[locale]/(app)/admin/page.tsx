import { redirect } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { AdminPanel } from "@/components/admin-panel";
import { isAdminRole } from "@/lib/utils";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  if (!session || !isAdminRole(session.role)) {
    redirect({ href: "/comunicar", locale });
  }

  return (
    <div>
      <AdminPanel />
    </div>
  );
}
