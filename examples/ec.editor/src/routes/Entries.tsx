import { useOidc } from "@axa-fr/react-oidc";
import { useNavigate, useParams } from "react-router-dom";
import { EntryTable } from "../components/EntryTable";

export function Entries() {
  const { logout } = useOidc();
  const { shortID, model } = useParams();
  const navigate = useNavigate();
  return (
    <div>
      <div className="flex justify-between">
        <button onClick={() => navigate(`/dm/${shortID}/model`)}>
          modelList
        </button>
        <button onClick={() => logout("/")}>Logout</button>
      </div>
      <EntryTable
        shortID={shortID}
        model={model}
        onClick={(entryID) =>
          navigate(`/dm/${shortID}/model/${model}/entry/${entryID}`)
        }
      />
    </div>
  );
}
