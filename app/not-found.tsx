import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <h1 className="text-4xl font-bold mb-4">Page not found</h1>
      <p className="text-muted-foreground mb-6">The article you were looking for isn't here.</p>
      <Link href="/" className="text-orange-600 hover:underline">
        ← Back to the blog
      </Link>
    </div>
  );
}
