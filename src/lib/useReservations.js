import { useCallback, useEffect, useState } from "react";
import { fetchReservations, reserveGiftRequest } from "./api.js";

/* Carrega e mantém as reservas sincronizadas com o servidor.
   - Busca o mapa completo de reservas ao montar.
   - Atualiza sozinho a cada poucos segundos (se a aba estiver visível), assim
     se outra convidada reservar um presente enquanto a página está aberta,
     ele aparece como reservado automaticamente sem precisar recarregar.
   - Também atualiza assim que a aba volta a ficar visível. */
export function useReservations() {
  const [reservations, setReservations] = useState({});

  const loadReservations = useCallback(async () => {
    try {
      const data = await fetchReservations();
      setReservations(data);
    } catch (e) {
      console.error("Erro ao carregar reservas:", e);
    }
  }, []);

  useEffect(() => {
    loadReservations();

    const interval = setInterval(() => {
      if (document.hidden) return; // não gasta recursos com a aba em segundo plano
      loadReservations();
    }, 7000);

    const onVisibility = () => {
      if (!document.hidden) loadReservations();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadReservations]);

  /* Tenta reservar um presente no servidor. Retorna { ok: true } em caso de
     sucesso, ou { ok: false, error } com uma mensagem para exibir no modal. */
  const reserveGift = useCallback(async (id, name) => {
    const result = await reserveGiftRequest(id, name);

    if (result.conflict) {
      setReservations((prev) => ({ ...prev, [id]: result.name }));
      return { ok: false, error: result.error };
    }
    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    setReservations((prev) => ({ ...prev, [id]: name }));
    return { ok: true };
  }, []);

  return { reservations, reserveGift };
}
