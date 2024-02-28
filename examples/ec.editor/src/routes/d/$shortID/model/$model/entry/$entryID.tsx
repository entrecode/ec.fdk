import { createFileRoute } from "@tanstack/react-router";
import { useFdk } from "../../../../../../useFdk";

export const Route = createFileRoute("/d/$shortID/model/$model/entry/$entryID")(
  {
    component: EntryDetail,
  }
);

function EntryDetail() {
  const { shortID, model, entryID } = Route.useParams();
  const { data: entry } = useFdk({
    env: "stage",
    dmShortID: shortID,
    model,
    entryID,
    action: "getEntry",
  });
  return <pre>{entry && JSON.stringify(entry, null, 2)}</pre>;
}
