import { ACADEMY } from "@/lib/academy/config";
import styles from "./venue-map.module.css";

export function VenueMap() {
  return (
    <figure className={styles.map}>
      <iframe
        src={ACADEMY.mapsEmbedUrl}
        title="Doon Pickleball Academy location on Google Maps"
        width="600"
        height="400"
        loading="lazy"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <figcaption className={styles.caption}>
        <span>Pan and zoom to plan your visit.</span>
        <a href={ACADEMY.mapsUrl} target="_blank" rel="noopener noreferrer">
          Open in Google Maps
        </a>
      </figcaption>
    </figure>
  );
}
