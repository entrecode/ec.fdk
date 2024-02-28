import { useOidc } from "@axa-fr/react-oidc";
import { ModelTable } from "../components/ModelTable";
import { useNavigate, useParams } from "react-router-dom";

export function Models() {
  const { logout } = useOidc();
  const { shortID } = useParams();
  const navigate = useNavigate();
  return (
    <div>
      <div className="flex justify-between">
        <button onClick={() => navigate("/")}>dmList</button>
        <button onClick={() => logout("/")}>Logout</button>
      </div>
      <ModelTable
        shortID={shortID}
        onClick={(model) => navigate(`/dm/${shortID}/model/${model}/entry`)}
      />
    </div>
  );
}
