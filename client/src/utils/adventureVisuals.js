import cover1 from "../assets/adventures/adventure-cover-1.webp";
import cover2 from "../assets/adventures/adventure-cover-2.webp";
import cover3 from "../assets/adventures/adventure-cover-3.webp";
import cover4 from "../assets/adventures/adventure-cover-4.webp";
import cover5 from "../assets/adventures/adventure-cover-5.webp";
import cover6 from "../assets/adventures/adventure-cover-6.webp";

const covers = [cover1, cover2, cover3, cover4, cover5, cover6];

const iconCoverIndex = {
  lock: 0,
  link: 1,
  user: 2,
  message: 3,
  camera: 4,
  help: 5,
};

export function getAdventureFallbackCover(adventure, index = 0) {
  const displayOrder = Number(adventure?.display_order);

  if (Number.isInteger(displayOrder) && displayOrder >= 1 && displayOrder <= covers.length) {
    return covers[displayOrder - 1];
  }

  const iconIndex = iconCoverIndex[String(adventure?.icon || "").toLowerCase()];
  if (Number.isInteger(iconIndex)) return covers[iconIndex];

  return covers[Math.abs(Number(index) || 0) % covers.length];
}

export const adventureFallbackCovers = covers;
