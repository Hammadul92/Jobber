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
    <div className="w-full px-4 py-5 bg-white border-b border-gray-200 md:px-12 lg:px-12 lg:pr-14">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight md:text-3xl text-primary">
            Dashboard
          </h1>
          <p className="mt-1 text-base text-slate-500">
            Welcome back, {firstName}. Here&apos;s an overview of your
            business.
          </p>
        </div>

        <div className="flex items-center self-start gap-3 lg:self-center">
          {/* <label className="relative hidden md:block">
            <LuSearch className="absolute w-5 h-5 -translate-y-1/2 pointer-events-none left-4 top-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search..."
              className="h-12 pl-12 pr-4 text-base transition bg-white border border-gray-200 outline-none w-72 rounded-2xl text-slate-700 focus:border-accent"
            />
          </label> */}

          <button
            type="button"
            aria-label="Notifications"
            className="relative inline-flex items-center justify-center transition h-11 w-11 rounded-xl text-slate-500 hover:bg-gray-100 hover:text-slate-700"
          >
            <LuBell className="w-6 h-6" />
            <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-accent" />
          </button>

          {/* <button
            type="button"
            aria-label="Messages"
            className="inline-flex items-center justify-center transition h-11 w-11 rounded-xl text-slate-500 hover:bg-gray-100 hover:text-slate-700"
          >
            <LuMessageSquare className="w-6 h-6" />
          </button> */}
        </div>
      </div>
    </div>
  );
}

export default DashboardTopbar;
