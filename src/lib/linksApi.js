const API_URL = import.meta.env.VITE_API_URL || "/api";

// Leitura pública dos links cadastrados
export async function fetchLinks() {
  const res = await fetch(`${API_URL}/links`);
  if (!res.ok) throw new Error("Erro ao buscar links");
  return res.json();
}

// Salva os links de um item (protegido por sessão HttpOnly no backend)
export async function saveLinks(id, links) {
  try {
    const res = await fetch(`${API_URL}/links/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ links }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) return { ok: false, error: "Sessão expirada. Faça login novamente." };
    if (!res.ok) return { ok: false, error: data.error || "Não foi possível salvar agora." };
    return { ok: true, links: data.links };
  } catch (e) {
    return { ok: false, error: "Não foi possível conectar ao servidor." };
  }
}
