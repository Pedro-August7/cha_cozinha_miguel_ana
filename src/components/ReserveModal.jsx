import { useEffect, useRef, useState } from "react";

export default function ReserveModal({ open, giftName, onCancel, onConfirm }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setName("");
      setError("");
      const t = setTimeout(() => inputRef.current?.focus(), 100);
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
    const result = await onConfirm(trimmed);
    if (result && result.ok === false) {
      setError(result.error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleConfirm();
  };

  return (
    <div
      className="overlay show"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="modal">
        <h4>{giftName}</h4>
        <p>Digite seu nome para reservar este presente. Assim ninguém mais poderá escolher o mesmo item.</p>
        <input ref={inputRef} type="text" placeholder="Seu nome completo" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleKeyDown} />
        <div className="modal-error">{error}</div>
        <div className="modal-actions">
          <button onClick={onCancel}>Cancelar</button>
          <button className="confirm" onClick={handleConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
