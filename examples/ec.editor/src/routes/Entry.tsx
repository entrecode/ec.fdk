import { useParams } from "react-router-dom";
import { useFdk } from "../useFdk";
import { MainLayout } from "../layouts/MainLayout";

export function Entry() {
  const { shortID, model, entryID } = useParams();
  const { data: entry } = useFdk({
    env: "stage",
    dmShortID: shortID,
    model,
    entryID,
    action: "getEntry",
  });
  return (
    <MainLayout>
      <pre>{entry && JSON.stringify(entry, null, 2)}</pre>
    </MainLayout>
  );
}
