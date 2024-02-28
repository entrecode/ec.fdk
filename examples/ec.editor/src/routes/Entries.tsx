import { useNavigate, useParams } from "react-router-dom";
import { EntryTable } from "../components/EntryTable";
import { MainLayout } from "../layouts/MainLayout";

export function Entries() {
  const { shortID, model } = useParams();
  const navigate = useNavigate();
  return (
    <MainLayout>
      <EntryTable
        shortID={shortID}
        model={model}
        onClick={(entryID) =>
          navigate(`/dm/${shortID}/model/${model}/entry/${entryID}`)
        }
      />
    </MainLayout>
  );
}
