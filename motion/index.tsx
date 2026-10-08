import { Composition, Still, registerRoot } from "remotion";
import { CourtFilm } from "./court-film";
import { HeroBall } from "./hero-ball";

const FilmRoot = () => (
  <>
    <Composition
      id="DoonFilm"
      component={CourtFilm}
      durationInFrames={240}
      fps={30}
      width={1280}
      height={720}
    />
    <Still id="DoonBall" component={HeroBall} width={1024} height={1024} />
  </>
);

registerRoot(FilmRoot);
