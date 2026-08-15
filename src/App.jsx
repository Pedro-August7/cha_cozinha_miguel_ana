import { useRef, useState } from "react";
import Hero from "./components/Hero.jsx";
import LocalSection from "./components/LocalSection.jsx";
import GiftsSection from "./components/GiftsSection.jsx";
import ReserveModal from "./components/ReserveModal.jsx";
import PhotoModal from "./components/PhotoModal.jsx";
import Toast from "./components/Toast.jsx";
import Footer from "./components/Footer.jsx";
import { useReservations } from "./lib/useReservations.js";
import { useLinks } from "./lib/useLinks.js";
import { useGifts } from "./lib/useGifts.js";

export default function App() {
  const { catalog } = useGifts();
  const { reservations, reserveGift } = useReservations();
  const links = useLinks();

  const [reserveTarget, setReserveTarget] = useState(null); // { id, name }
  const [photoTarget, setPhotoTarget] = useState(null); // { id, name, iconKey }
  const [toastMessage, setToastMessage] = useState("");
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(""), 2600);
  };

  const handleChoose = (id, name) => setReserveTarget({ id, name });
  const handleCancelReserve = () => setReserveTarget(null);

  const handleConfirmReserve = async (guestName) => {
    if (!reserveTarget) return;
    const result = await reserveGift(reserveTarget.id, guestName);
    if (result.ok) {
      showToast("Presente reservado, obrigada " + guestName.split(" ")[0] + "! 💐");
      setReserveTarget(null);
    }
    return result;
  };

  const handleOpenPhoto = (id, name, iconKey) => setPhotoTarget({ id, name, iconKey });
  const handleClosePhoto = () => setPhotoTarget(null);

  return (
    <>
      <div className="texture"></div>

      <Hero />
      <LocalSection />
      <GiftsSection catalog={catalog} reservations={reservations} onChoose={handleChoose} onOpenPhoto={handleOpenPhoto} />
      <Footer />

      <ReserveModal open={Boolean(reserveTarget)} giftName={reserveTarget?.name} onCancel={handleCancelReserve} onConfirm={handleConfirmReserve} />
      <PhotoModal open={Boolean(photoTarget)} name={photoTarget?.name} iconKey={photoTarget?.iconKey} links={photoTarget ? links[photoTarget.id] : undefined} onClose={handleClosePhoto} />
      <Toast message={toastMessage} />
    </>
  );
}
