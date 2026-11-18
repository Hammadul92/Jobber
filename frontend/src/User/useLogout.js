import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { api, useLogoutUserMutation } from "../store";

// Signs the user out (token + public-site session cookie), drops cached API
// data, and returns to sign-in. Shared by the desktop sidebar and mobile menu.
export default function useLogout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [logoutUser] = useLogoutUserMutation();

  return async () => {
    await logoutUser();
    dispatch(api.util.resetApiState());
    localStorage.removeItem("token");
    navigate("/sign-in");
  };
}
