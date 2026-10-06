import { route } from "@/server/api";
import { readUpload, UPLOAD_KINDS } from "@/server/uploads";
import { canViewPrivateFile } from "@/server/services/file-access";
import { NextResponse } from "next/server";

const notFound = () => new NextResponse("Not Found", { status: 404 });

export const GET = route({}, async ({ params, user }) => {
  const p = await params;
  const rawPath = p.path;
  const relativePath = Array.isArray(rawPath) ? rawPath.join("/") : rawPath;

  if (!relativePath) return notFound();

  const file = await readUpload(relativePath);
  if (!file) return notFound();

  const isPublic = UPLOAD_KINDS[file.kind].public;

  if (!isPublic) {
    if (!user) return new NextResponse("Unauthorized", { status: 401 });
    const allowed = await canViewPrivateFile(
      { id: user.id, role: user.role },
      relativePath,
    );
    // 404 (bukan 403) supaya orang tidak bisa menebak file mana yang ada.
    if (!allowed) return notFound();
  }

  return new NextResponse(file.buf, {
    headers: {
      "Content-Type": file.mimeType,
      "Cache-Control": isPublic
        ? "public, max-age=31536000, immutable"
        : "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Last-Modified": file.mtime.toUTCString(),
    },
  });
});