import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toErrorResponse } from "@/shared/errors";
import { validate, createApiKeySchema } from "@/shared/validation/schemas";
import * as apiKeyService from "@/modules/api-keys/api-key.service";

// GET /api/v1/api-keys
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "AUTHENTICATION_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const keys = await apiKeyService.listApiKeys(session.user.id);
    return NextResponse.json({ apiKeys: keys });
  } catch (error) {
    const { error: err, status } = toErrorResponse(error);
    return NextResponse.json({ error: err }, { status });
  }
}

// POST /api/v1/api-keys
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "AUTHENTICATION_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const input = validate(createApiKeySchema, body);
    const result = await apiKeyService.createApiKey(session.user.id, input);
    return NextResponse.json({ apiKey: result }, { status: 201 });
  } catch (error) {
    const { error: err, status } = toErrorResponse(error);
    return NextResponse.json({ error: err }, { status });
  }
}
