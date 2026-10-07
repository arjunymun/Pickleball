import { Composition, registerRoot } from "remotion";
import { CourtFilm } from "./court-film";

const FilmRoot = () => (
  <Composition
    id="DoonFilm"
    component={CourtFilm}
    durationInFrames={240}
    fps={30}
    width={1280}
    height={720}
  />
);

registerRoot(FilmRoot);
