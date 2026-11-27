import { FaBars } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import {
  cloneElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { LuLayoutDashboard } from "react-icons/lu";
import { label, icons } from "./navigation";
import WorkspaceNavigation from "../Components/ui/WorkspaceNavigation";
import DashboardTopbar from "../User/DashboardTopbar";
import Topbar from "../User/Topbar";
import { GlobalSearch } from "./Utilities";
import useNotifications from "./useNotifications";

const navigation = [
  "users",
  "admins",
  "businesses",
  "clients",
  "services",
  "questionnaires",
  "terms-templates",
  "quotes",
  "invoices",
  "team",
  "jobs",
  "assignments",
  "photos",
  "payments",
  "refunds",
  "payment-methods",
  "catalog",
  "faqs",
  "reports",
  "activity",
  "audit",
  "system",
  "trash",
];
export default function Shell({
  auth,
  recordLabel,
  resource,
  id,
  description,
  onLogout,
  api,
  children,
  actions,
}) {
  const [open, setOpen] = useState(false);
  const notifications = useNotifications(api, auth.id);
  const main = useRef(null);
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    main.current?.scrollTo(0, 0);
  }, [resource, id]);
  const user = {
    id: auth.id,
    name: auth.display_name || auth.name?.split("@")[0] || "Super Admin",
    email: auth.email || auth.name,
    photoUrl: auth.photo_url,
  };
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);
  const items = [
    {
      name: "Dashboard",
      path: "/super-admin",
      icon: LuLayoutDashboard,
      end: true,
      active: !resource,
    },
    ...navigation.map((key) => ({
      name: label(key),
      path: `/super-admin/${key}`,
      icon: icons[key],
    })),
  ];
  const nav = (
    <WorkspaceNavigation
      user={user}
      navigationItems={items}
      onLogout={onLogout}
      onNavigate={() => setOpen(false)}
    />
  );
  return (
    <div className="flex min-h-screen bg-gray-50">
      <a href="#super-admin-content" className="sr-only focus:not-sr-only">
        Skip to content
      </a>
      <div className="fixed inset-x-0 top-0 z-40 flex items-end justify-between p-4 shadow-sm bg-background text-secondary md:px-12 lg:hidden">
        <button
          aria-label="Open navigation"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <FaBars className="text-[20px] md:text-[28px]" />
        </button>
        <img
          src="/images/contractorz-logo-horizontal.svg"
          alt="Contractorz"
          className="mr-6 w-30 md:w-36"
        />
        <span />
        {open && (
          <>
            <div
              className="fixed inset-0 bg-black/40"
              onClick={() => setOpen(false)}
            />
            <nav
              aria-label="Mobile navigation"
              className="absolute top-0 left-0 h-dvh w-4/5 md:w-2/5 max-w-sm p-2"
            >
              <div className="flex flex-col h-full p-3 overflow-y-auto bg-white shadow-md rounded-3xl overscroll-contain">
                <button
                  aria-label="Close navigation"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center h-10 mb-6 mr-auto text-black bg-white border border-gray-200 shadow-sm w-9 rounded-xl hover:bg-gray-100"
                >
                  <IoClose className="w-6 h-8" />
                </button>
                {cloneElement(nav, { compact: true })}
              </div>
            </nav>
          </>
        )}
      </div>
      <aside className="hidden lg:block sidebar min-h-screen border-r border-gray-200 w-76 shrink-0">
        {nav}
      </aside>
      <main
        ref={main}
        className="flex-1 min-w-0 min-h-screen overflow-auto pt-15 md:pt-14 lg:pt-0"
      >
        {!resource ? (
          <DashboardTopbar
            user={user}
            {...notifications}
            description={`Welcome back, ${user.name.split(" ")[0]}. Here's an overview of your platform.`}
          >
            <GlobalSearch api={api} />
          </DashboardTopbar>
        ) : (
          <Topbar
            config={{
              title: id
                ? recordLabel || `${label(resource)} Details`
                : label(resource),
              description,
              headingTag: "h1",
            }}
            backFallback={
              id
                ? `/super-admin/${resource}${window.location.search}`
                : undefined
            }
            breadcrumbs={[
              { label: "GetContractorz", to: "/super-admin" },
              { label: "Platform", to: "/super-admin" },
              {
                label: label(resource),
                to: id ? `/super-admin/${resource}` : undefined,
              },
              ...(id ? [{ label: recordLabel || "Details" }] : []),
            ]}
            extraActions={
              <>
                <GlobalSearch api={api} />
                {actions}
              </>
            }
          />
        )}
        <div
          id="super-admin-content"
          className="px-4 pt-8 pb-4 md:px-12 md:pt-12 lg:pb-12 lg:p-12 lg:pr-14 space-y-6"
        >
          {children}
        </div>
      </main>
    </div>
  );
}
