import { ICONS } from "../data/icons.js";

export default function GiftCard({ id, name, iconKey, reservedName, onChoose, onOpenPhoto }) {
  const isReserved = Boolean(reservedName);

  const handleIconActivate = () => onOpenPhoto(id, name, iconKey);
  const handleIconKeyDown = (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    handleIconActivate();
  };

  return (
    <div className="gift-card" data-id={id} data-icon={iconKey}>
      <div
        className="gift-icon"
        role="button"
        tabIndex={0}
        aria-label={`Onde comprar ${name}`}
        title="Onde comprar"
        onClick={handleIconActivate}
        onKeyDown={handleIconKeyDown}
        dangerouslySetInnerHTML={{ __html: (ICONS[iconKey] || ICONS.jar) + '<span class="zoom-hint">🔍</span>' }}
      />
      <div className="gift-body">
        <div className="name">{name}</div>
        <div className={"gift-status " + (isReserved ? "taken" : "free")}>
          {isReserved ? "Reservado por " + reservedName : "Disponível"}
        </div>
        <button
          className={"gift-btn" + (isReserved ? " reserved" : "")}
          disabled={isReserved}
          onClick={() => onChoose(id, name, iconKey)}
        >
          {isReserved ? "Reservado" : "Dar este presente"}
        </button>
      </div>
    </div>
  );
}
