import { useEffect, useState } from "react";
import { DATA } from "../data/gifts.js";
import { fetchCustomGifts, getMergedGiftsCatalog } from "./api.js";

export function useGifts() {
  const [catalog, setCatalog] = useState(DATA);
  const [customGifts, setCustomGifts] = useState([]);

  const loadGifts = async () => {
    const custom = await fetchCustomGifts();
    setCustomGifts(custom);
    setCatalog(getMergedGiftsCatalog(custom));
  };

  useEffect(() => {
    loadGifts();
  }, []);

  return { catalog, customGifts, reloadGifts: loadGifts };
}
