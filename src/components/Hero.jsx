export default function Hero() {
  return (
    <section className="hero">
      <svg className="corner tl" viewBox="0 0 200 200">
        <path d="M0 0 C 40 30, 60 70, 55 120 C 90 90, 130 95, 160 130 C 130 60, 90 20, 0 0 Z" fill="#8A9678" opacity="0.18" />
        <path d="M0 0 C 30 20, 45 55, 40 95" stroke="#b8935a" strokeWidth="1.4" fill="none" opacity="0.5" />
      </svg>
      <svg className="corner tr" viewBox="0 0 200 200">
        <path d="M0 0 C 40 30, 60 70, 55 120 C 90 90, 130 95, 160 130 C 130 60, 90 20, 0 0 Z" fill="#8A9678" opacity="0.18" />
        <path d="M0 0 C 30 20, 45 55, 40 95" stroke="#b8935a" strokeWidth="1.4" fill="none" opacity="0.5" />
      </svg>

      <div className="monogram">A</div>
      <div className="eyebrow">Com muito carinho</div>
      <h1>Chá de Panela</h1>
      <div className="sub">de Ana Júlia</div>

      <div className="divider">✦</div>

      <div className="details">
        <div className="detail">
          <div className="label">Data</div>
          <div className="value">22 de Agosto</div>
        </div>
        <div className="detail">
          <div className="label">Horário</div>
          <div className="value">15h</div>
        </div>
        <div className="detail">
          <div className="label">Local</div>
          <div className="value">Novo Itabirito</div>
        </div>
      </div>

      <div className="women-note">
        <p>Evento exclusivo para mulheres</p>
        <p>Cada convidada, além do presente, é convidada a trazer um prato de salgados</p>
      </div>

      <div className="scroll-cue">role para ver mais ↓</div>
    </section>
  );
}
