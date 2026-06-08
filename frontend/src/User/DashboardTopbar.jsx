import { LuBell, LuMessageSquare, LuSearch } from "react-icons/lu";

const getFirstName = (user) => {
  const displayName =
    user?.name ||
    user?.full_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    "User";

  return displayName.split(" ")[0] || "User";
};

function DashboardTopbar({ user }) {
  const firstName = getFirstName(user);

  return (
    <div className="w-full border-b border-gray-200 bg-white px-4 py-5 md:px-8 lg:px-8 lg:pr-14">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-primary">
            Dashboard
          </h1>
          <p className="mt-1 text-base text-slate-500">
            Welcome back, {firstName}. Here&apos;s an overview of your
            business.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-center">
          <label className="relative hidden md:block">
            <LuSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search..."
              className="h-12 w-72 rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-base text-slate-700 outline-none transition focus:border-accent"
            />
          </label>

          <button
            type="button"
            aria-label="Notifications"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition hover:bg-gray-100 hover:text-slate-700"
          >
            <LuBell className="h-6 w-6" />
            <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-accent" />
          </button>

          <button
            type="button"
            aria-label="Messages"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition hover:bg-gray-100 hover:text-slate-700"
          >
            <LuMessageSquare className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardTopbar;
