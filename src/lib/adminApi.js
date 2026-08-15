import ExcelJS from "exceljs";

const API_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * Sanitiza valores contra CSV/Excel Formula Injection.
 * Se o valor iniciar com '=', '+', '-', '@', '\t' ou '\r', adiciona apóstrofo no início.
 */
export function sanitizeExcelValue(val) {
  if (val === null || val === undefined) return "";
  const rawStr = String(val);
  if (/^[=+\-@\t\r]/.test(rawStr) || /^[=+\-@\t\r]/.test(rawStr.trim())) {
    return `'${rawStr.trim()}`;
  }
  return rawStr.trim();
}

export async function checkAdminAuth() {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) return { authed: false };
    const data = await res.json().catch(() => ({}));
    return { authed: Boolean(data.authed) };
  } catch (e) {
    return { authed: false };
  }
}

export async function loginAdmin(password) {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || "Código de acesso incorreto." };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Não foi possível conectar ao servidor. Tente novamente." };
  }
}

export async function logoutAdmin() {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (e) {
    console.error(e);
  }
}

export async function changeAccessCode(oldCode, newCode) {
  try {
    const res = await fetch(`${API_URL}/auth/change-code`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ oldCode, newCode }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || "Não foi possível alterar o código." };
    return { ok: true, message: data.message };
  } catch (e) {
    return { ok: false, error: "Erro de conexão com o servidor." };
  }
}

/**
 * Gera e dispara o download da planilha oficial .xlsx estilizada e protegida contra Formula Injection.
 */
export async function exportReservationsToExcel(giftsList) {
  if (!Array.isArray(giftsList) || giftsList.length === 0) {
    alert("Não há dados de presentes para exportar.");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Chá de Panela - Ana Júlia";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Presentes", {
    views: [{ showGridLines: true }],
  });

  // Cabeçalhos
  worksheet.columns = [
    { header: "Presente", key: "name", width: 32 },
    { header: "Categoria", key: "category", width: 22 },
    { header: "Status", key: "status", width: 16 },
    { header: "Reservado Por", key: "reservedBy", width: 28 },
  ];

  // Estilização da linha de cabeçalho
  const headerRow = worksheet.getRow(1);
  headerRow.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFA35468" }, // Tom de rosa elegante do projeto
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 26;

  // Linhas de dados com sanitização
  giftsList.forEach((g) => {
    const isReserved = Boolean(g.reservedName);
    const row = worksheet.addRow({
      name: sanitizeExcelValue(g.name),
      category: sanitizeExcelValue(g.catTitle),
      status: isReserved ? "Reservado" : "Disponível",
      reservedBy: sanitizeExcelValue(g.reservedName || "-"),
    });

    row.height = 20;
    row.alignment = { vertical: "middle" };

    // Destaque visual suave para linhas reservadas
    if (isReserved) {
      row.getCell("status").font = { color: { argb: "FFA35468" }, bold: true };
      row.getCell("reservedBy").font = { color: { argb: "FF4A3F42" }, bold: true };
    } else {
      row.getCell("status").font = { color: { argb: "FF2E6D32" } };
    }
  });

  // Gera o buffer e dispara o download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  link.download = `presentes_cha_de_panela_${dateStr}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
