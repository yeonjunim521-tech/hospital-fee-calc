interface Env {
  ADMIN_BASIC_AUTH?: string;
}

const PROTECTED_PATHS = new Set([
  "/admin-search",
  "/admin-search.html",
  "/admin-dashboard-prototype",
  "/admin-dashboard-prototype.html",
]);

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.has(pathname) || pathname.startsWith("/api/admin/");
}

function unauthorizedResponse() {
  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="hospital-fee-calc admin", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

function forbiddenResponse() {
  return new Response("Forbidden", {
    status: 403,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function isAdminMutation(request: Request, pathname: string): boolean {
  return pathname.startsWith("/api/admin/") && !["GET", "HEAD", "OPTIONS"].includes(request.method);
}

function decodeBasicAuth(header: string | null): string | null {
  if (!header) return null;

  const [scheme, encoded] = header.split(" ");
  if (scheme !== "Basic" || !encoded) return null;

  try {
    return atob(encoded);
  } catch {
    return null;
  }
}

export async function onRequest(context: PagesFunction<Env>) {
  const pathname = new URL(context.request.url).pathname;
  if (!isProtectedPath(pathname)) {
    return context.next();
  }

  const expected = context.env.ADMIN_BASIC_AUTH?.trim();
  if (!expected) {
    console.error("ADMIN_BASIC_AUTH is not configured for protected admin routes.");
    return new Response("Admin auth is not configured.", {
      status: 500,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  const credentials = decodeBasicAuth(context.request.headers.get("Authorization"));
  if (credentials !== expected) {
    return unauthorizedResponse();
  }

  if (isAdminMutation(context.request, pathname)) {
    const requestOrigin = context.request.headers.get("Origin");
    const expectedOrigin = new URL(context.request.url).origin;
    if (requestOrigin !== expectedOrigin) {
      return forbiddenResponse();
    }
  }

  return context.next();
}
