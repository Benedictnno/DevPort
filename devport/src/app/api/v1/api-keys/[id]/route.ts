import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toErrorResponse } from "@/shared/errors";
import * as apiKeyService from "@/modules/api-keys/api-key.service";

type RouteParams = { params: Promise<{ id: string }> };

// DELETE /api/v1/api-keys/:id
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "AUTHENTICATION_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    await apiKeyService.revokeApiKey(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: err, status } = toErrorResponse(error);
    return NextResponse.json({ error: err }, { status });
  }
}
