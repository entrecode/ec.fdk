import { ColumnDef } from "@tanstack/react-table";
// import { format } from "date-fns";
import { DataTable } from "@/components/ui/data-table";

import { useFdk } from "@/useFdk";
// import type { ModelResource } from "ec.fdk/dist/index.d.mts";
import { useNavigate } from "react-router-dom";

declare interface PublicModelResource {
  config: any;
  description: string;
  hexColor: string;
  modelID: string;
  title: string;
  titleField: string;
  _ref: string;
}

// export const columns: ColumnDef<ModelResource>[] = [
export const columns: ColumnDef<PublicModelResource>[] = [
  {
    accessorKey: "hexColor",
    header: "",
    cell: ({ row }) => {
      return (
        <div
          className="font-medium w-1 h-5 rounded-md"
          style={{ backgroundColor: row.getValue("hexColor") }}
        ></div>
      );
    },
  },
  /* {
    accessorKey: "created",
    header: "Created",
    cell: ({ row }) => {
      const formatted = format(row.getValue("created"), "dd.MM.yy");
      return <div className="font-medium">{formatted}</div>;
    },
  }, */
  {
    accessorKey: "title",
    header: "Titel",
  },
  {
    accessorKey: "description",
    header: "description",
  },
];

export function ModelTable({
  shortID,
  onClick,
}: {
  shortID?: string;
  onClick: (model: string) => void;
}) {
  const { data: api } = useFdk(
    shortID
      ? {
          env: "stage",
          dmShortID: shortID,
          action: "publicApi",
        }
      : null
  );
  // below request loads modelList via long dmID, but public model list might be enough here..
  /* const { data: modelList } = useFdk(
    api
      ? {
          env: "stage",
          dmID: api.dataManagerID,
          action: "modelList",
        }
      : null
  );
  console.log("modelList", modelList); */
  return (
    <div className="container mx-auto py-10">
      <DataTable
        columns={columns}
        //data={modelList?.items || []}
        data={api?.models || []}
        onClick={(row) => onClick(row.original.title)}
      />
    </div>
  );
}
