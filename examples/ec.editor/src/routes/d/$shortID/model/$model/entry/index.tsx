import { createFileRoute, useNavigate } from "@tanstack/react-router";
// import { format } from "date-fns";

export const Route = createFileRoute("/d/$shortID/model/$model/entry/")({
  component: EntryTable,
});

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { DataTable } from "@/components/ui/data-table";

import { useFdk } from "@/useFdk";
// import type { ModelResource } from "ec.fdk/dist/index.d.mts";

declare type EntryResource = any;

export const columns: ColumnDef<EntryResource>[] = [
  {
    accessorKey: "created",
    header: "Created",
    cell: ({ row }) => {
      const formatted = format(row.getValue("created"), "dd.MM.yy");
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "_entryTitle",
    header: "Titel",
  },
];

export function EntryTable() {
  const { shortID, model } = Route.useParams();
  const navigate = useNavigate();
  const { data: entryList } = useFdk(
    shortID && model
      ? {
          env: "stage",
          dmShortID: shortID,
          model,
          action: "entryList",
        }
      : null
  );
  return (
    <div className="container mx-auto py-10">
      <DataTable
        columns={columns}
        data={entryList?.items || []}
        onClick={(row) =>
          navigate({
            from: "/d/$shortID/model/$model/entry/",
            to: `$entryID`,
            params: { entryID: row.original.id },
          })
        }
      />
    </div>
  );
}
