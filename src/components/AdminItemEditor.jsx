import { useState } from "react";
import { saveLinks } from "../lib/linksApi.js";

const EMPTY_ROW = { store: "", url: "" };

export default function AdminItemEditor({ id, name, initialLinks }) {
  const [rows, setRows] = useState(initialLinks && initialLinks.length ? initialLinks.map((l) => ({ ...l })) : [{ ...EMPTY_ROW }]);
  const [status, setStatus] = useState(""); // "", "saving", "saved", "error"
  const [error, setError] = useState("");

  const updateRow = (i, field, value) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  const removeRow = (i) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setStatus("saving");
    setError("");
    const cleaned = rows
      .map((r) => ({ store: r.store.trim(), url: r.url.trim() }))
      .filter((r) => r.store && /^https?:\/\//i.test(r.url));

    const result = await saveLinks(id, cleaned);
    if (result.ok) {
      setStatus("saved");
      setTimeout(() => setStatus(""), 2000);
    } else {
      setStatus("error");
      setError(result.error || "Não foi possível salvar.");
    }
  };

  return (
    <div className="admin-item">
      <div className="admin-item-name">{name}</div>
      <div className="admin-links-form">
        {rows.map((row, i) => (
          <div className="admin-link-row" key={i}>
            <input
              type="text"
              placeholder="Loja (ex: Amazon)"
              value={row.store}
              maxLength={40}
              onChange={(e) => updateRow(i, "store", e.target.value)}
            />
            <input
              type="url"
              placeholder="https://..."
              value={row.url}
              maxLength={500}
              onChange={(e) => updateRow(i, "url", e.target.value)}
            />
            <button type="button" className="admin-remove-row" onClick={() => removeRow(i)} aria-label="Remover link" title="Remover">
              ✕
            </button>
          </div>
        ))}
        <div className="admin-item-actions">
          <button type="button" className="admin-add-row" onClick={addRow}>
            + Adicionar loja
          </button>
          <button type="button" className="admin-save" onClick={handleSave} disabled={status === "saving"}>
            {status === "saving" ? "Salvando..." : "Salvar"}
          </button>
          {status === "saved" && <span className="admin-status ok">Salvo!</span>}
          {status === "error" && <span className="admin-status error">{error}</span>}
        </div>
      </div>
    </div>
  );
}
