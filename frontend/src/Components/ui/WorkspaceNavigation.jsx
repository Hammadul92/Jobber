import { NavLink } from "react-router-dom";
import { LuLogOut } from "react-icons/lu";

// Shared presentation for the account workspace and platform workspace.
export default function WorkspaceNavigation({
  user,
  accountItems = [],
  navigationItems = [],
  workspaceName,
  onLogout,
  onNavigate,
  compact = false,
}) {
  const displayName = user?.name || "User";
  return (
    <div
      className={`bg-white flex flex-col ${compact ? "flex-1 p-0" : "min-h-full p-6"}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
          <span className="text-lg font-bold text-gray-500">
            {displayName.charAt(0).toUpperCase()}
          </span>
          {(user?.photoUrl || user?.photo) && (
            <img
              src={user.photoUrl || user.photo}
              alt="Profile"
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.hidden = true;
              }}
            />
          )}
        </div>
        <div className="min-w-0">
          <div
            className={`font-semibold break-words ${compact ? "text-lg leading-tight" : "text-xl"}`}
          >
            {displayName}
          </div>
          <div title={user?.email} className="text-sm text-gray-500 truncate">
            {user?.email}
          </div>
        </div>
      </div>
      {accountItems.some((i) => i.visible !== false) && (
        <nav
          aria-label="Account"
          className={`mb-4 space-y-1 bg-gray-50 border border-gray-100 rounded-xl ${compact ? "p-1" : "p-2"}`}
        >
          {accountItems
            .filter((i) => i.visible !== false)
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.key === "business"}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl ${compact ? "px-3 py-2" : "p-3"} font-medium transition ${isActive ? "bg-accent text-white font-bold shadow-lg shadow-accent/50" : "text-gray-500 hover:bg-secondary hover:text-white font-medium"}`
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
        </nav>
      )}
      {workspaceName && (
        <>
          <div
            className={`${compact ? "mt-2" : "mt-4"} text-[0.7rem] text-gray-400 font-semibold`}
          >
            WORKSPACE
          </div>
          <div className="mb-4 font-bold text-lg text-gray-900">
            {workspaceName}
          </div>
        </>
      )}
      <nav
        aria-label="Workspace"
        className={`mb-4 space-y-1 rounded-xl ${compact ? "flex-1" : "px-2"}`}
      >
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl ${compact ? "px-3 py-2" : "p-3"} font-medium transition ${(item.active ?? isActive) ? "bg-gray-100 text-black font-bold" : "text-gray-500 hover:bg-gray-100 hover:text-black font-medium"}`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-6 px-3">
        <button
          onClick={onLogout}
          type="button"
          className={`p-3 flex items-center gap-2 text-gray-500 hover:text-accent hover:bg-gray-100 w-full text-sm font-medium rounded-xl ${compact ? "bg-gray-100 border border-gray-200" : ""}`}
        >
          <LuLogOut className="w-5 h-5" />
          Logout Account
        </button>
      </div>
    </div>
  );
}
