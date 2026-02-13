import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const rawBackendUrl =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const backendBaseUrl = rawBackendUrl.replace(/\/+$/, "");

function buildTargetUrl(request: NextRequest, path: string[]): string {
  const suffix = path.length > 0 ? `/${path.join("/")}` : "";
  return `${backendBaseUrl}/api/v1${suffix}${request.nextUrl.search}`;
}

async function proxyRequest(request: NextRequest, path: string[]): Promise<NextResponse> {
  const targetUrl = buildTargetUrl(request, path);
  const headers = new Headers(request.headers);

  headers.delete("host");
  headers.delete("content-length");

  const body =
    request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: upstream.headers,
    });
  } catch {
    return NextResponse.json(
      {
        detail:
          "Unable to reach backend service. Check BACKEND_URL/NEXT_PUBLIC_API_URL and backend health.",
      },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: any
): Promise<NextResponse> {
  const params = await context.params;
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function POST(
  request: NextRequest,
  context: any
): Promise<NextResponse> {
  const params = await context.params;
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function PUT(
  request: NextRequest,
  context: any
): Promise<NextResponse> {
  const params = await context.params;
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function PATCH(
  request: NextRequest,
  context: any
): Promise<NextResponse> {
  const params = await context.params;
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function DELETE(
  request: NextRequest,
  context: any
): Promise<NextResponse> {
  const params = await context.params;
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function OPTIONS(
  request: NextRequest,
  context: any
): Promise<NextResponse> {
  const params = await context.params;
  const { path } = await params;
  return proxyRequest(request, path);
}
