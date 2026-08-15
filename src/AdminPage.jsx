import { useEffect, useState } from "react";
import { DATA, slugify } from "./data/gifts.js";
import { ICONS } from "./data/icons.js";
import { fetchLinks, saveLinks } from "./lib/linksApi.js";
import {
  fetchReservations,
  cancelReservationRequest,
  fetchCustomGifts,
  addCustomGiftRequest,
  deleteCustomGiftRequest,
  getMergedGiftsCatalog,
} from "./lib/api.js";
import {
  checkAdminAuth,
  loginAdmin,
  logoutAdmin,
  changeAccessCode,
  exportReservationsToExcel,
} from "./lib/adminApi.js";
import AdminItemEditor from "./components/AdminItemEditor.jsx";

const CATEGORY_OPTIONS = [
  { key: "cozinha", title: "Cozinha", defaultIcon: "potSet" },
  { key: "utensilios", title: "Utensílios", defaultIcon: "spatula" },
  { key: "mesa", title: "Mesa", defaultIcon: "plate" },
  { key: "organizacao", title: "Organização", defaultIcon: "jar" },
  { key: "eletro", title: "Eletroportáteis", defaultIcon: "blender" },
];

const ICON_SUGGESTIONS = [
  { key: "potSet", label: "Panela" },
  { key: "fryPan", label: "Frigideira" },
  { key: "pressureCooker", label: "Panela de Pressão" },
  { key: "bakingTray", label: "Tabuleiro" },
  { key: "cakeMold", label: "Forma de Bolo" },
  { key: "glassDish", label: "Refratário / Travessa" },
  { key: "bowl", label: "Tigela / Bowl" },
  { key: "grater", label: "Ralador" },
  { key: "knifeSet", label: "Facas" },
  { key: "cuttingBoard", label: "Tábua" },
  { key: "whisk", label: "Fuet / Batedor" },
  { key: "spatula", label: "Espátula" },
  { key: "ladle", label: "Concha" },
  { key: "tongs", label: "Pegador" },
  { key: "measuring", label: "Medidor" },
  { key: "plate", label: "Prato" },
  { key: "glass", label: "Copo" },
  { key: "wineGlass", label: "Taça" },
  { key: "cupSaucer", label: "Xícara" },
  { key: "cutlery", label: "Talheres" },
  { key: "cakeStand", label: "Boleira" },
  { key: "pitcher", label: "Jarra" },
  { key: "jar", label: "Pote / Vidro" },
  { key: "spiceRack", label: "Porta Temperos" },
  { key: "dryRack", label: "Escorredor" },
  { key: "organizer", label: "Organizador" },
  { key: "blender", label: "Liquidificador / Triturador" },
  { key: "airfryer", label: "Airfryer" },
  { key: "coffeeMaker", label: "Cafeteira" },
  { key: "toaster", label: "Torradeira" },
  { key: "kettle", label: "Chaleira" },
  { key: "mixer", label: "Batedeira" },
  { key: "sandwichMaker", label: "Sanduicheira" },
];

export default function AdminPage() {
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loginError, setLoginError] = useState("");

  // Abas
  const [activeTab, setActiveTab] = useState("reservations"); // 'reservations' | 'links'

  // Dados
  const [customGifts, setCustomGifts] = useState([]);
  const [reservations, setReservations] = useState({});
  const [links, setLinks] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'reserved' | 'free'
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modal: Adicionar Novo Presente
  const [isAddGiftModalOpen, setIsAddGiftModalOpen] = useState(false);
  const [newGiftName, setNewGiftName] = useState("");
  const [newGiftCategory, setNewGiftCategory] = useState("cozinha");
  const [newGiftIcon, setNewGiftIcon] = useState("potSet");
  const [newGiftStore, setNewGiftStore] = useState("");
  const [newGiftUrl, setNewGiftUrl] = useState("");
  const [addGiftSaving, setAddGiftSaving] = useState(false);
  const [addGiftError, setAddGiftError] = useState("");

  // Modal: Alterar Código
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [oldCodeInput, setOldCodeInput] = useState("");
  const [newCodeInput, setNewCodeInput] = useState("");
  const [codeSaving, setCodeSaving] = useState(false);
  const [codeMessage, setCodeMessage] = useState({ type: "", text: "" });

  // Banner temporário
  const [bannerNotice, setBannerNotice] = useState("");
  const showBanner = (msg) => {
    setBannerNotice(msg);
    setTimeout(() => setBannerNotice(""), 3500);
  };

  // 1. Verifica autenticação via sessão HttpOnly
  useEffect(() => {
    checkAdminAuth().then((result) => {
      setAuthed(result.authed);
      setChecking(false);
    });
  }, []);

  // 2. Carrega todos os dados
  const loadAllData = async () => {
    setLoadingData(true);
    try {
      const [resData, linksData, customData] = await Promise.all([
        fetchReservations().catch(() => ({})),
        fetchLinks().catch(() => ({})),
        fetchCustomGifts().catch(() => []),
      ]);
      setReservations(resData);
      setLinks(linksData);
      setCustomGifts(customData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (authed) {
      loadAllData();
    }
  }, [authed]);

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setChecking(true);
    const result = await loginAdmin(accessCodeInput);
    setChecking(false);
    if (result.ok) {
      setAuthed(true);
      setAccessCodeInput("");
    } else {
      setLoginError(result.error || "Código de acesso incorreto.");
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setAuthed(false);
    setAccessCodeInput("");
  };

  // Abrir Modal de Adicionar Presente
  const openAddGiftModal = () => {
    setNewGiftName("");
    setNewGiftCategory("cozinha");
    setNewGiftIcon("potSet");
    setNewGiftStore("");
    setNewGiftUrl("");
    setAddGiftError("");
    setIsAddGiftModalOpen(true);
  };

  // Salvar Novo Presente
  const handleSaveNewGift = async (e) => {
    e.preventDefault();
    const trimmedName = newGiftName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setAddGiftError("Informe o nome do presente (mínimo 2 caracteres).");
      return;
    }

    setAddGiftSaving(true);
    setAddGiftError("");

    const result = await addCustomGiftRequest({
      name: trimmedName,
      categoryKey: newGiftCategory,
      iconKey: newGiftIcon,
    });

    if (result.ok) {
      setCustomGifts(result.customGifts);

      // Se informou link de compra inicial, salva junto
      if (newGiftStore.trim() && /^https?:\/\//i.test(newGiftUrl.trim())) {
        const giftId = newGiftCategory + "__" + slugify(trimmedName);
        await saveLinks(giftId, [{ store: newGiftStore.trim(), url: newGiftUrl.trim() }]);
        const updatedLinks = await fetchLinks().catch(() => ({}));
        setLinks(updatedLinks);
      }

      setIsAddGiftModalOpen(false);
      showBanner(`Presente "${trimmedName}" adicionado com sucesso à categoria ${CATEGORY_OPTIONS.find((c) => c.key === newGiftCategory)?.title || ""}!`);
    } else {
      setAddGiftError(result.error || "Erro ao adicionar presente.");
    }

    setAddGiftSaving(false);
  };

  // Excluir Presente Customizado
  const handleDeleteCustomGift = async (giftId, giftName) => {
    if (!window.confirm(`Deseja realmente remover o presente "${giftName}" da lista?`)) {
      return;
    }

    const result = await deleteCustomGiftRequest(giftId);
    if (result.ok) {
      setCustomGifts(result.customGifts);
      showBanner(`Presente "${giftName}" removido.`);
    } else {
      alert(result.error || "Erro ao remover presente.");
    }
  };

  // Liberar Reserva de Presente
  const handleCancelReservation = async (giftId, guestName) => {
    if (!window.confirm(`Deseja realmente liberar este presente reservado por "${guestName}"?`)) {
      return;
    }
    const result = await cancelReservationRequest(giftId);
    if (result.ok) {
      setReservations((prev) => {
        const next = { ...prev };
        delete next[giftId];
        return next;
      });
      showBanner("Presente liberado com sucesso! Agora ele está disponível para os convidados.");
    } else {
      alert(result.error || "Não foi possível liberar o presente.");
    }
  };

  // Alterar Código de Acesso
  const handleChangeCodeSubmit = async (e) => {
    e.preventDefault();
    if (!newCodeInput.trim() || newCodeInput.trim().length < 4) {
      setCodeMessage({ type: "error", text: "O novo código deve ter pelo menos 4 caracteres." });
      return;
    }
    setCodeSaving(true);
    setCodeMessage({ type: "", text: "" });

    const result = await changeAccessCode(oldCodeInput.trim(), newCodeInput.trim());
    setCodeSaving(false);

    if (result.ok) {
      setCodeMessage({ type: "ok", text: "Código de acesso atualizado com sucesso!" });
      setTimeout(() => {
        setIsCodeModalOpen(false);
        setOldCodeInput("");
        setNewCodeInput("");
        setCodeMessage({ type: "", text: "" });
      }, 1500);
    } else {
      setCodeMessage({ type: "error", text: result.error || "Erro ao alterar código." });
    }
  };

  // Catálogo Mesclado (Padrão + Customizados)
  const currentCatalog = getMergedGiftsCatalog(customGifts);

  // Lista plana de todos os presentes
  const allGiftsList = currentCatalog.flatMap((cat) =>
    cat.items.map(([name, iconKey, isCustom]) => {
      const id = cat.key + "__" + slugify(name);
      return {
        id,
        name,
        iconKey,
        catKey: cat.key,
        catTitle: cat.title,
        isCustom: Boolean(isCustom),
        reservedName: reservations[id] || null,
      };
    })
  );

  const totalGifts = allGiftsList.length;
  const reservedGiftsList = allGiftsList.filter((g) => Boolean(g.reservedName));
  const reservedCount = reservedGiftsList.length;
  const freeCount = totalGifts - reservedCount;
  const reservedPercentage = totalGifts > 0 ? Math.round((reservedCount / totalGifts) * 100) : 0;

  // Filtragem
  const filteredGifts = allGiftsList.filter((g) => {
    const isReserved = Boolean(g.reservedName);

    if (filterStatus === "reserved" && !isReserved) return false;
    if (filterStatus === "free" && isReserved) return false;

    if (categoryFilter !== "all" && g.catKey !== categoryFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = g.name.toLowerCase().includes(term);
      const matchReserved = (g.reservedName || "").toLowerCase().includes(term);
      const matchCat = g.catTitle.toLowerCase().includes(term);
      if (!matchName && !matchReserved && !matchCat) return false;
    }

    return true;
  });

  // --- TELA DE LOGIN COM CÓDIGO ---
  if (checking && !authed) {
    return (
      <div className="admin-gate">
        <div className="admin-gate-card">
          <div className="script" style={{ fontSize: "2.2rem" }}>
            Painel da Noiva
          </div>
          <p style={{ marginTop: 12 }}>Verificando sessão segura...</p>
        </div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="admin-gate">
        <form className="admin-gate-card" onSubmit={handleLogin}>
          <div className="script" style={{ fontSize: "2.4rem", color: "var(--rose-deep)" }}>
            Painel da Noiva
          </div>
          <p style={{ margin: "14px 0 20px", fontSize: "0.92rem", color: "var(--ink)", opacity: 0.85 }}>
            Digite o código de acesso para gerenciar os presentes reservados, adicionar novos itens e links de compra.
          </p>

          <input
            type="password"
            placeholder="Código de acesso (ex: anaju0120)"
            value={accessCodeInput}
            onChange={(e) => setAccessCodeInput(e.target.value)}
            autoFocus
          />

          {loginError && <div className="modal-error">{loginError}</div>}

          <button type="submit" className="admin-save" style={{ width: "100%", padding: "12px" }} disabled={checking}>
            {checking ? "Verificando..." : "Entrar no Painel"}
          </button>

          <a className="admin-back-link" href="/">
            ← Voltar para o site
          </a>
        </form>
      </div>
    );
  }

  // --- PAINEL DA NOIVA AUTENTICADO ---
  return (
    <div className="admin-page">
      <div className="section-inner" style={{ maxWidth: 1040, padding: "40px 20px 80px" }}>
        {/* Banner de Notificação */}
        {bannerNotice && <div className="admin-banner-notice">{bannerNotice}</div>}

        {/* Top Header */}
        <header className="admin-header">
          <div>
            <div className="eyebrow" style={{ letterSpacing: 3 }}>Área Exclusiva</div>
            <h2 style={{ fontSize: "2.2rem" }}>Painel da Noiva</h2>
            <p className="section-lead" style={{ margin: "6px 0 0", fontSize: "0.95rem" }}>
              Acompanhe os presentes reservados, adicione novos itens e gerencie os links das lojas.
            </p>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={() => {
                setOldCodeInput("");
                setNewCodeInput("");
                setCodeMessage({ type: "", text: "" });
                setIsCodeModalOpen(true);
              }}
              title="Alterar código de acesso ao painel"
            >
              🔑 Alterar Código
            </button>
            <a href="/" className="admin-btn-secondary" style={{ textDecoration: "none" }}>
              ← Ver o site
            </a>
            <button type="button" className="admin-btn-danger" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </header>

        {/* Navegação por Abas */}
        <div className="admin-nav-tabs">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "reservations" ? "active" : ""}`}
            onClick={() => setActiveTab("reservations")}
          >
            🎁 Lista de Presentes ({totalGifts})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "links" ? "active" : ""}`}
            onClick={() => setActiveTab("links")}
          >
            🔗 Links das Lojas
          </button>
        </div>

        {/* ======================= ABA 1: LISTA & RESERVAS ======================= */}
        {activeTab === "reservations" && (
          <div className="admin-tab-content">
            {/* Cards de Métricas */}
            <div className="admin-stats-grid">
              <div className="stat-card primary">
                <div className="stat-label">Presentes Reservados</div>
                <div className="stat-highlight">
                  <strong>{reservedCount}</strong> de <strong>{totalGifts}</strong> itens reservados
                </div>
                <div className="stat-progress-bar">
                  <div className="stat-progress-fill" style={{ width: `${reservedPercentage}%` }}></div>
                </div>
                <div className="stat-sub">{reservedPercentage}% do catálogo escolhido</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Ainda Disponíveis</div>
                <div className="stat-number stat-pending">{freeCount}</div>
                <div className="stat-sub">Presentes livres para escolha</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Total do Catálogo</div>
                <div className="stat-number">{totalGifts}</div>
                <div className="stat-sub">Itens divididos em {currentCatalog.length} categorias</div>
              </div>
            </div>

            {/* Barra de Filtros & Ações */}
            <div className="admin-action-bar">
              <div className="admin-filters">
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="🔍 Buscar presente ou quem reservou..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <select
                  className="admin-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Todos os Presentes ({totalGifts})</option>
                  <option value="reserved">Apenas Reservados ({reservedCount})</option>
                  <option value="free">Apenas Disponíveis ({freeCount})</option>
                </select>

                <select
                  className="admin-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">Todas Categorias</option>
                  {currentCatalog.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-btn-group">
                <button
                  type="button"
                  className="admin-btn-add"
                  onClick={openAddGiftModal}
                  title="Cadastrar um novo presente vinculado a uma categoria"
                >
                  ➕ Acrescentar Novo Item
                </button>

                <button
                  type="button"
                  className="admin-btn-export"
                  onClick={() => exportReservationsToExcel(allGiftsList)}
                  title="Baixar lista completa em planilha Excel (.xlsx)"
                >
                  📥 Baixar lista (.xlsx)
                </button>
              </div>
            </div>

            {/* Tabela de Presentes */}
            <div className="admin-table-container">
              {loadingData ? (
                <div className="admin-table-empty">Carregando presentes...</div>
              ) : filteredGifts.length === 0 ? (
                <div className="admin-table-empty">
                  Nenhum presente encontrado com os filtros selecionados.
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Presente</th>
                      <th>Categoria</th>
                      <th>Status</th>
                      <th>Reservado Por</th>
                      <th style={{ textAlign: "right" }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGifts.map((item) => {
                      const isItemReserved = Boolean(item.reservedName);

                      return (
                        <tr key={item.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span
                                style={{ width: 22, height: 22, color: "var(--rose-deep)", display: "inline-flex" }}
                                dangerouslySetInnerHTML={{ __html: ICONS[item.iconKey] || ICONS.jar }}
                              />
                              <div>
                                <strong>{item.name}</strong>
                                {item.isCustom && (
                                  <span style={{ marginLeft: 6, fontSize: "0.7rem", color: "var(--rose)", background: "var(--cream-deep)", padding: "2px 6px", borderRadius: 8 }}>
                                    Adicionado
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge-category">{item.catTitle}</span>
                          </td>
                          <td>
                            <span className={`badge-pill ${isItemReserved ? "badge-pill-taken" : "badge-pill-free"}`}>
                              {isItemReserved ? "Reservado" : "Disponível"}
                            </span>
                          </td>
                          <td>
                            {isItemReserved ? (
                              <span className="badge-guest-name">💖 {item.reservedName}</span>
                            ) : (
                              <span style={{ color: "var(--ink)", opacity: 0.4 }}>—</span>
                            )}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                              {isItemReserved && (
                                <button
                                  type="button"
                                  className="btn-release-gift"
                                  onClick={() => handleCancelReservation(item.id, item.reservedName)}
                                  title="Liberar presente de volta para a lista"
                                >
                                  Liberar presente
                                </button>
                              )}
                              {item.isCustom && (
                                <button
                                  type="button"
                                  className="btn-table-action delete"
                                  onClick={() => handleDeleteCustomGift(item.id, item.name)}
                                  title="Remover item cadastrado da lista"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="admin-table-footer-note">
              Exibindo <strong>{filteredGifts.length}</strong> de <strong>{totalGifts}</strong> presentes do catálogo.
            </div>
          </div>
        )}

        {/* ======================= ABA 2: LINKS DAS LOJAS ======================= */}
        {activeTab === "links" && (
          <div className="admin-tab-content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <p className="section-lead" style={{ margin: 0, textAlign: "left" }}>
                Cadastre os links das lojas onde cada presente pode ser comprado. Os convidados verão esses links ao tocarem no ícone do presente.
              </p>
              <button
                type="button"
                className="admin-btn-add"
                onClick={openAddGiftModal}
              >
                ➕ Acrescentar Novo Item
              </button>
            </div>

            {links === null ? (
              <p>Carregando presentes...</p>
            ) : (
              currentCatalog.map((cat) => (
                <div className="category" key={cat.key} style={{ marginTop: 24 }}>
                  <div className="category-head">
                    <h3>{cat.title}</h3>
                    <div className="count">{cat.items.length} itens</div>
                  </div>
                  <div className="admin-item-list">
                    {cat.items.map(([name]) => {
                      const id = cat.key + "__" + slugify(name);
                      return <AdminItemEditor key={id} id={id} name={name} initialLinks={links[id]} />;
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ======================= MODAL: ADICIONAR NOVO PRESENTE ======================= */}
      {isAddGiftModalOpen && (
        <div className="overlay show" onClick={(e) => e.target === e.currentTarget && setIsAddGiftModalOpen(false)}>
          <div className="modal admin-modal-card">
            <h4>Acrescentar Novo Item</h4>
            <p style={{ margin: "4px 0 18px", fontSize: "0.88rem", opacity: 0.8 }}>
              Cadastre um novo presente para a lista, vinculado a uma categoria.
            </p>

            <form onSubmit={handleSaveNewGift}>
              <div className="admin-form-group">
                <label className="admin-form-label">Nome do Presente *</label>
                <input
                  type="text"
                  placeholder="Ex: Batedeira planetária, Faqueiro 24 peças..."
                  value={newGiftName}
                  maxLength={60}
                  onChange={(e) => setNewGiftName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Categoria *</label>
                  <select
                    className="admin-form-select"
                    value={newGiftCategory}
                    onChange={(e) => {
                      const catKey = e.target.value;
                      setNewGiftCategory(catKey);
                      const def = CATEGORY_OPTIONS.find((c) => c.key === catKey);
                      if (def) setNewGiftIcon(def.defaultIcon);
                    }}
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Ícone / Ilustração</label>
                  <select
                    className="admin-form-select"
                    value={newGiftIcon}
                    onChange={(e) => setNewGiftIcon(e.target.value)}
                  >
                    {ICON_SUGGESTIONS.map((icon) => (
                      <option key={icon.key} value={icon.key}>
                        {icon.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Link de compra inicial opcional */}
              <div style={{ marginTop: 6, borderTop: "1px dashed var(--line)", paddingTop: 14 }}>
                <label className="admin-form-label" style={{ marginBottom: 8, display: "block" }}>
                  Link de Compra (Opcional)
                </label>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <input
                      type="text"
                      placeholder="Loja (ex: Amazon, Magalu)"
                      value={newGiftStore}
                      maxLength={40}
                      onChange={(e) => setNewGiftStore(e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={newGiftUrl}
                      maxLength={500}
                      onChange={(e) => setNewGiftUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {addGiftError && <div className="modal-error" style={{ margin: "8px 0" }}>{addGiftError}</div>}

              <div className="modal-actions" style={{ marginTop: 18 }}>
                <button type="button" onClick={() => setIsAddGiftModalOpen(false)} disabled={addGiftSaving}>
                  Cancelar
                </button>
                <button type="submit" className="confirm" disabled={addGiftSaving}>
                  {addGiftSaving ? "Salvando..." : "Salvar Presente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: ALTERAR CÓDIGO DE ACESSO ======================= */}
      {isCodeModalOpen && (
        <div className="overlay show" onClick={(e) => e.target === e.currentTarget && setIsCodeModalOpen(false)}>
          <div className="modal admin-modal-card">
            <h4>Alterar Código de Acesso</h4>
            <p style={{ margin: "4px 0 18px", fontSize: "0.88rem", opacity: 0.8 }}>
              Defina um novo código seguro para entrar no Painel da Noiva.
            </p>

            <form onSubmit={handleChangeCodeSubmit}>
              <div className="admin-form-group">
                <label className="admin-form-label">Código Atual (Opcional)</label>
                <input
                  type="password"
                  placeholder="Código atual"
                  value={oldCodeInput}
                  onChange={(e) => setOldCodeInput(e.target.value)}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Novo Código de Acesso</label>
                <input
                  type="password"
                  placeholder="Novo código (mínimo 4 caracteres)"
                  value={newCodeInput}
                  onChange={(e) => setNewCodeInput(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {codeMessage.text && (
                <div
                  className={`admin-status ${codeMessage.type === "ok" ? "ok" : "error"}`}
                  style={{ margin: "10px 0" }}
                >
                  {codeMessage.text}
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" onClick={() => setIsCodeModalOpen(false)} disabled={codeSaving}>
                  Cancelar
                </button>
                <button type="submit" className="confirm" disabled={codeSaving}>
                  {codeSaving ? "Alterando..." : "Salvar Novo Código"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
