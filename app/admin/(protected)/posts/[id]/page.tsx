import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PostEditor } from "@/components/admin/PostEditor";

export const dynamic = "force-dynamic";

export default async function AdminPostEditPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: post } = await supabase.from("posts").select("*").eq("id", params.id).maybeSingle();
  if (!post) notFound();

  return (
    <div className="max-w-4xl">
      <div className="mb-4">
        <Link href="/admin/posts" className="text-sm text-muted-foreground hover:underline">
          ← All posts
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-6">Edit post</h1>
      <PostEditor post={post} />
    </div>
  );
}
