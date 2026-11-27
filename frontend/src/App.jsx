import { lazy, Suspense } from "react";
const SuperAdmin = lazy(() => import("./super-admin/SuperAdmin"));
import Routes from "./Routes";
import AlertHost from "./Components/ui/AlertHost";
import "./App.css";

function App() {
  if (
    window.location.pathname === "/super-admin" ||
    window.location.pathname.startsWith("/super-admin/")
  )
    return (
      <Suspense
        fallback={
          <div role="status" className="p-8">
            Loading dashboard…
          </div>
        }
      >
        <SuperAdmin />
      </Suspense>
    );
  return (
    <>
      <Routes />
      <AlertHost />
    </>
  );
}

export default App;
