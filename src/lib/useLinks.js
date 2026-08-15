import { useCallback, useEffect, useState } from "react";
import { fetchLinks } from "./linksApi.js";

/* Lado dos convidados: só leitura. Busca ao montar e atualiza de tempos em
   tempos, assim quando os noivos cadastram um link novo, ele aparece sem
   precisar recarregar a página. */
export function useLinks() {
  const [links, setLinks] = useState({});

  const load = useCallback(async () => {
    try {
      const data = await fetchLinks();
      setLinks(data);
    } catch (e) {
      console.error("Erro ao carregar links:", e);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      if (document.hidden) return;
      load();
    }, 15000);
    return () => clearInterval(interval);
  }, [load]);

  return links;
}
