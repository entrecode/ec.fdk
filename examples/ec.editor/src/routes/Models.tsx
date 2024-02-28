import { useOidc } from "@axa-fr/react-oidc";
import { ModelTable } from "../components/ModelTable";
import { useNavigate, useParams } from "react-router-dom";

export function Models() {
  const { logout } = useOidc();
  const { dmID } = useParams();
  const navigate = useNavigate();
  return (
    <div>
      <div className="flex justify-between">
        <button onClick={() => navigate("/")}>dmList</button>
        <button onClick={() => logout("/")}>Logout</button>
      </div>
      {dmID && <ModelTable dmID={dmID} />}
    </div>
  );
}
