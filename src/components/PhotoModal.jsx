import { ICONS } from "../data/icons.js";

export default function PhotoModal({ open, name, iconKey, links, onClose }) {
  if (!open) return null;

  const storeLinks = Array.isArray(links) ? links : [];

  return (
    <div
      className="overlay show"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal photo-modal">
        <h4>{name}</h4>
        <div className="photo-frame">
          <div className="placeholder-icon" dangerouslySetInnerHTML={{ __html: ICONS[iconKey] || ICONS.jar }} />
        </div>

        {storeLinks.length > 0 ? (
          <div className="store-links">
            {storeLinks.map((link, i) => (
              <a key={i} className="store-link" href={link.url} target="_blank" rel="noopener noreferrer">
                Comprar em {link.store}
              </a>
            ))}
          </div>
        ) : (
          <p className="photo-caption">Nenhum link de compra cadastrado para este presente ainda.</p>
        )}

        <button className="photo-close" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}

