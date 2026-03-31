import { NextResponse } from "next/server";
import { ingestSource } from "@/lib/adapters/ingest";
import { discoverSources } from "@/lib/adapters/runner";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sourceType, basePath } = body as {
      sourceType: string;
      basePath?: string;
    };

    if (!sourceType) {
      return NextResponse.json(
        { error: "sourceType is required" },
        { status: 400 }
      );
    }

    const result = await ingestSource(sourceType, basePath);

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Ingest failed: ${message}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const sources = await discoverSources();
    return NextResponse.json({ sources });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Discovery failed: ${message}` },
      { status: 500 }
    );
  }
}
