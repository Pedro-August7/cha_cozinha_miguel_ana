import { useEffect, useRef, useState } from "react";
import { DATA, slugify } from "../data/gifts.js";
import { CAT_ICON } from "../data/icons.js";
import CategoryNav from "./CategoryNav.jsx";
import GiftCard from "./GiftCard.jsx";

export default function GiftsSection({ catalog = DATA, reservations, onChoose, onOpenPhoto }) {
  const currentCatalog = Array.isArray(catalog) && catalog.length ? catalog : DATA;
  const [activeKey, setActiveKey] = useState(currentCatalog[0]?.key || "cozinha");
  const sectionRefs = useRef({});

  const scrollToCategory = (key) => {
    sectionRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const onScroll = () => {
      let current = currentCatalog[0]?.key || "cozinha";
      currentCatalog.forEach((cat) => {
        const el = sectionRefs.current[cat.key];
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.top < 160) current = cat.key;
      });
      setActiveKey(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [currentCatalog]);

  return (
    <section id="presentes">
      <div className="section-inner">
        <div className="section-title">
          <div className="eyebrow">Lista de presentes</div>
          <h2>Um mimo para o novo lar</h2>
          <p className="section-lead">
            Escolha um presente e deixe seu nome — assim evitamos presentes repetidos e cada convidado escolhe algo especial. Depois de reservado, o item fica marcado para os demais convidados.
          </p>
        </div>

        <CategoryNav categories={currentCatalog} activeKey={activeKey} onSelect={scrollToCategory} />

        <div id="categories">
          {currentCatalog.map((cat) => (
            <div
              className="category"
              id={"cat-" + cat.key}
              key={cat.key}
              ref={(el) => {
                sectionRefs.current[cat.key] = el;
              }}
            >
              <div className="category-head">
                <div className="cat-icon" dangerouslySetInnerHTML={{ __html: CAT_ICON[cat.key] || CAT_ICON.cozinha }} />
                <h3>{cat.title}</h3>
                <div className="count">{cat.items.length} itens</div>
              </div>
              <div className="gift-grid" data-cat={cat.key}>
                {cat.items.map(([name, iconKey]) => {
                  const id = cat.key + "__" + slugify(name);
                  return (
                    <GiftCard
                      key={id}
                      id={id}
                      name={name}
                      iconKey={iconKey || "jar"}
                      reservedName={reservations[id]}
                      onChoose={onChoose}
                      onOpenPhoto={onOpenPhoto}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
