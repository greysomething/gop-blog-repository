import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { LogoutButton } from "@/components/admin/LogoutButton";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-[calc(100vh-68px)]">
      <aside className="w-56 shrink-0 border-r bg-slate-50 p-4">
        <div className="mb-6">
          <Link href="/admin" className="text-sm font-semibold">
            GOP Blog admin
          </Link>
        </div>
        <nav className="space-y-1 text-sm">
          {[
            ["/admin", "Dashboard"],
            ["/admin/queue", "Review queue"],
            ["/admin/posts", "Posts"],
            ["/admin/topics", "Topics"],
            ["/admin/sources", "Sources"],
            ["/admin/runs", "Pipeline runs"],
            ["/admin/prompts", "Prompts"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="block rounded px-2 py-1.5 hover:bg-white hover:shadow-sm"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 pt-6 border-t">
          <LogoutButton />
        </div>
      </aside>
      <div className="flex-1 p-8 overflow-x-auto">{children}</div>
    </div>
  );
}
