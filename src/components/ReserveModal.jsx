import { useEffect, useRef, useState } from "react";
import { ICONS } from "../data/icons.js";

export default function ReserveModal({ open, giftName, iconKey, links, onCancel, onConfirm }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setName("");
      setError("");
      setSubmitting(false);
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Por favor, digite seu nome.");
      return;
    }
    setSubmitting(true);
    const result = await onConfirm(trimmed);
    if (result && result.ok === false) {
      setError(result.error);
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleConfirm();
  };

  const hasStoreLinks = Array.isArray(links) && links.length > 0;

  return (
    <div
      className="overlay show"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="modal reserve-modal-enhanced">
        {iconKey && (
          <div
            className="reserve-modal-icon"
            dangerouslySetInnerHTML={{ __html: ICONS[iconKey] || ICONS.jar }}
          />
        )}
        <h4>{giftName}</h4>

        {/* Links de Onde Comprar (se cadastrados) */}
        {hasStoreLinks && (
          <div className="reserve-store-box">
            <div className="reserve-store-label">🛍️ Sugestões de onde comprar:</div>
            <div className="store-links" style={{ margin: "8px 0 16px" }}>
              {links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-link"
                >
                  Comprar em {link.store} ↗
                </a>
              ))}
            </div>
          </div>
        )}

        <p style={{ margin: hasStoreLinks ? "4px 0 14px" : "0 0 16px", fontSize: "0.9rem" }}>
          Digite seu nome abaixo para confirmar que você dará este presente:
        </p>

        <input
          ref={inputRef}
          type="text"
          placeholder="Seu nome completo"
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {error && <div className="modal-error">{error}</div>}

        <div className="modal-actions" style={{ marginTop: 12 }}>
          <button type="button" onClick={onCancel} disabled={submitting}>
            Cancelar
          </button>
          <button type="button" className="confirm" onClick={handleConfirm} disabled={submitting}>
            {submitting ? "Confirmando..." : "Dar este presente"}
          </button>
        </div>
      </div>
    </div>
  );
}
