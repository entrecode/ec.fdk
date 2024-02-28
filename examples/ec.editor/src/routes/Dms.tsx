import { useOidc } from "@axa-fr/react-oidc";
import { DatamanagerTable } from "../components/DatamanagerTable";
import { useNavigate } from "react-router-dom";

export function Dms() {
  const { logout } = useOidc();
  const navigate = useNavigate();
  return (
    <div>
      <div className="flex justify-between">
        <p></p>
        {/* <button onClick={() => navigate("/")}>dmList</button> */}
        <button onClick={() => logout("/")}>Logout</button>
      </div>
      <DatamanagerTable
        onClick={(shortID) => navigate(`/dm/${shortID}/model`)}
      />
    </div>
  );
}
