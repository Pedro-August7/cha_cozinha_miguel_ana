import { DATA, slugify } from "../data/gifts.js";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export async function fetchReservations() {
  const res = await fetch(`${API_URL}/reservations`);
  if (!res.ok) throw new Error("Erro ao buscar reservas");
  return res.json();
}

export async function reserveGiftRequest(id, name) {
  try {
    const res = await fetch(`${API_URL}/reservations/${encodeURIComponent(id)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 409) {
      return { ok: false, conflict: true, name: data.name, error: data.error || "Esse presente já foi reservado por outra pessoa." };
    }
    if (res.status === 429) {
      return { ok: false, error: data.error || "Muitas tentativas. Aguarde um minuto e tente novamente." };
    }
    if (!res.ok) {
      return { ok: false, error: data.error || "Não foi possível salvar agora. Tente novamente em instantes." };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Não foi possível conectar ao servidor. Verifique sua conexão." };
  }
}

export async function cancelReservationRequest(id) {
  try {
    const res = await fetch(`${API_URL}/reservations/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) return { ok: false, error: "Sessão expirada. Faça login novamente." };
    if (!res.ok) return { ok: false, error: data.error || "Não foi possível cancelar a reserva." };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Erro de conexão ao tentar cancelar a reserva." };
  }
}

// ------------------- PRESENTES CUSTOMIZADOS (PAINEL DA NOIVA) -------------------

export async function fetchCustomGifts() {
  try {
    const res = await fetch(`${API_URL}/custom-gifts`);
    if (!res.ok) return [];
    const data = await res.json().catch(() => []);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

export async function addCustomGiftRequest(giftData) {
  try {
    const res = await fetch(`${API_URL}/custom-gifts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(giftData),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) return { ok: false, error: "Sessão expirada. Faça login novamente." };
    if (!res.ok) return { ok: false, error: data.error || "Não foi possível adicionar o presente." };
    return { ok: true, gift: data.gift, customGifts: data.customGifts };
  } catch (e) {
    return { ok: false, error: "Erro ao conectar com o servidor." };
  }
}

export async function deleteCustomGiftRequest(id) {
  try {
    const res = await fetch(`${API_URL}/custom-gifts/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) return { ok: false, error: "Sessão expirada. Faça login novamente." };
    if (!res.ok) return { ok: false, error: data.error || "Não foi possível remover o presente." };
    return { ok: true, customGifts: data.customGifts };
  } catch (e) {
    return { ok: false, error: "Erro ao conectar com o servidor." };
  }
}

/**
 * Mescla o catálogo base (DATA) com os presentes customizados adicionados pela noiva.
 */
export function getMergedGiftsCatalog(customGifts = []) {
  return DATA.map((cat) => {
    const categoryCustoms = customGifts
      .filter((cg) => cg.categoryKey === cat.key)
      .map((cg) => [cg.name, cg.iconKey || "jar", true]); // O terceiro elemento 'true' indica item customizado

    // Evita duplicatas pelo slug
    const existingSlugs = new Set(cat.items.map(([name]) => slugify(name)));
    const uniqueCustoms = categoryCustoms.filter(([name]) => !existingSlugs.has(slugify(name)));

    return {
      ...cat,
      items: [...cat.items, ...uniqueCustoms],
    };
  });
}
