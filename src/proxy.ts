import { NextResponse, type NextRequest } from "next/server";
import posts from "@/content/posts.json";

const slugs = new Set(posts.map((p) => p.slug));

/** Unknown article slugs get a real 404 status (the prerendered shell would otherwise stream as 200). */
export function proxy(request: NextRequest) {
  const slug = decodeURIComponent(request.nextUrl.pathname.split("/")[2] ?? "");
  if (!slugs.has(slug)) {
    return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
  }
}

export const config = { matcher: "/blogg/:slug" };
