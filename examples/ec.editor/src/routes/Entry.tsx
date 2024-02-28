import { useOidc } from "@axa-fr/react-oidc";
import { useNavigate, useParams } from "react-router-dom";
import { useFdk } from "../useFdk";

export function Entry() {
  const { logout } = useOidc();
  const { shortID, model, entryID } = useParams();
  const navigate = useNavigate();
  const { data: entry } = useFdk({
    env: "stage",
    dmShortID: shortID,
    model,
    entryID,
    action: "getEntry",
  });
  return (
    <div>
      <div className="flex justify-between">
        <button onClick={() => navigate(`/dm/${shortID}/model/${model}/entry`)}>
          entryList
        </button>
        <button onClick={() => logout("/")}>Logout</button>
      </div>
      <pre>{entry && JSON.stringify(entry, null, 2)}</pre>
    </div>
  );
}
