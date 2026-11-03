import { Link } from "react-router-dom";
import { LuTrash2 } from "react-icons/lu";
import { toolbarButtonClass } from "./TableToolbar";

// Opens the Trash page on this table's deleted records.
export default function TrashLink({ resource, className = "" }) {
  return (
    <Link
      to={`/user/business/trash?type=${resource}`}
      className={`${toolbarButtonClass} ${className}`}
      title="View and restore deleted records"
    >
      <LuTrash2 className="h-4 w-4" aria-hidden="true" />
      Trash
    </Link>
  );
}
