export function SideoutCourt3D() {
  return (
    <div className="sideout-3d-scene" aria-hidden="true">
      <div className="sideout-3d-stage">
        <div className="sideout-3d-court">
          <span className="sideout-3d-line sideout-3d-line-baseline sideout-3d-line-baseline-top" />
          <span className="sideout-3d-line sideout-3d-line-baseline sideout-3d-line-baseline-bottom" />
          <span className="sideout-3d-line sideout-3d-line-sideline sideout-3d-line-sideline-left" />
          <span className="sideout-3d-line sideout-3d-line-sideline sideout-3d-line-sideline-right" />
          <span className="sideout-3d-line sideout-3d-line-center" />
          <span className="sideout-3d-line sideout-3d-line-kitchen sideout-3d-line-kitchen-top" />
          <span className="sideout-3d-line sideout-3d-line-kitchen sideout-3d-line-kitchen-bottom" />
          <span className="sideout-3d-net" />
        </div>
        <span className="sideout-3d-ball" />
        <span className="sideout-3d-ball-shadow" />
      </div>
    </div>
  );
}
