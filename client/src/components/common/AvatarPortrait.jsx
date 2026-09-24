import avatarExplorer from "../../assets/avatar-explorer.webp";
import avatarHero from "../../assets/avatar-hero.webp";
import avatarGuardian from "../../assets/avatar-guardian.webp";
import avatarDetective from "../../assets/avatar-detective.webp";
import "./AvatarPortrait.css";

const avatarImages = {
  avatar1: avatarExplorer,
  avatar2: avatarHero,
  avatar3: avatarGuardian,
  avatar4: avatarDetective,
};

function AvatarPortrait({ avatar = "avatar1", size = "md", className = "", alt = "" }) {
  return (
    <span className={`avatar-portrait avatar-portrait-${size} ${className}`} aria-hidden={!alt}>
      <img src={avatarImages[avatar] || avatarExplorer} alt={alt} />
    </span>
  );
}

export default AvatarPortrait;
