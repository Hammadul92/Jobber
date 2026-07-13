export default function LoadingScreen({
  label = "",
  className = "",
  fullScreen = false,
}) {
  return (
    <div
      className={`app-loading-screen${fullScreen ? " app-loading-screen--fullscreen" : ""}${className ? ` ${className}` : ""}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="app-loading-spinner" aria-hidden="true">
        <span className="app-loading-square app-loading-square-1" />
        <span className="app-loading-square app-loading-square-2" />
        <span className="app-loading-square app-loading-square-3" />
        <span className="app-loading-square app-loading-square-4" />
        <span className="app-loading-square app-loading-square-5" />
      </div>
      {label ? <p className="app-loading-label">{label}</p> : null}
    </div>
  );
}
