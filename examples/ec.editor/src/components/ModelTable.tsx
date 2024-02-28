import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { DataTable } from "@/components/ui/data-table";

import { useFdk } from "@/useFdk";
import type { ModelResource } from "ec.fdk/dist/index.d.mts";

export const columns: ColumnDef<ModelResource>[] = [
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
  {
    accessorKey: "created",
    header: "Created",
    cell: ({ row }) => {
      const formatted = format(row.getValue("created"), "dd.MM.yy");
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "title",
    header: "Titel",
  },
  {
    accessorKey: "description",
    header: "description",
  },
];

export function ModelTable({ dmID }: { dmID: string }) {
  const { data: modelList } = useFdk({
    env: "stage",
    dmID,
    action: "modelList",
  });
  return (
    <div className="container mx-auto py-10">
      <DataTable
        columns={columns}
        data={modelList?.items || []}
        onClick={(row) => {
          console.log("tbd", row.original);
        }}
      />
    </div>
  );
}
