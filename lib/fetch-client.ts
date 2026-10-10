export function dispatch401() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:401"));
  }
}

// 402 = langganan komunitas tidak aktif → arahkan ke halaman pembayaran
function redirectLangganan() {
  if (typeof window !== "undefined" && window.location.pathname !== "/langganan") {
    window.location.href = "/langganan";
  }
}

export async function fetchClient(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401) {
    dispatch401();
  } else if (res.status === 402) {
    redirectLangganan();
  }
  return res;
}

export async function toError(res: Response, fallback: string): Promise<Error> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  return new Error(body?.error ?? fallback);
}
