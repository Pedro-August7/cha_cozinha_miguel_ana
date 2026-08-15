const ENDERECO = "Rua Castro Alves, 661, Novo Itabirito, Itabirito, MG";
const mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(ENDERECO);
const wazeUrl = "https://waze.com/ul?q=" + encodeURIComponent(ENDERECO) + "&navigate=yes";

export default function LocalSection() {
  return (
    <section className="local" id="local">
      <div className="section-inner">
        <div className="section-title">
          <div className="eyebrow">Onde será</div>
          <h2>O encontro</h2>
          <p className="section-lead">Preparamos um cantinho especial para celebrar essa nova fase com quem a gente ama. Será uma alegria ter você com a gente.</p>
        </div>

        <div className="local-grid">
          <div className="local-card">
            <h3>Rua Castro Alves, nº 661</h3>
            <p className="addr">
              Bairro Novo Itabirito
              <br />
              Itabirito / MG
            </p>
            <p>Sábado, 22 de agosto — às 15h</p>
            <div className="map-buttons">
              <a className="btn-map" href={mapsUrl} target="_blank" rel="noopener noreferrer">
                Abrir no Google Maps
              </a>
              <a className="btn-map btn-map-outline" href={wazeUrl} target="_blank" rel="noopener noreferrer">
                Abrir no Waze
              </a>
            </div>
          </div>
          <div className="map-visual">
            <svg viewBox="0 0 200 200" className="pin-illustration" aria-hidden="true">
              <circle cx="100" cy="90" r="70" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.25" />
              <circle cx="100" cy="90" r="46" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
              <path d="M100 40c-19 0-34 15-34 34 0 25 34 62 34 62s34-37 34-62c0-19-15-34-34-34z" fill="currentColor" opacity="0.9" />
              <circle cx="100" cy="74" r="12" fill="var(--cream)" />
            </svg>
            <p className="map-visual-text">
              Novo Itabirito
              <br />
              Itabirito / MG
            </p>
            <p className="map-caption">Toque em "Abrir no Google Maps" ou "Abrir no Waze" para traçar sua rota até o endereço exato.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
