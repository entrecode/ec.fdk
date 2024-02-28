import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { DataTable } from "@/components/ui/data-table";
import { useFdk } from "@/useFdk";
import type { DatamanagerResource } from "ec.fdk/dist/index.d.mts";
import { useNavigate } from "@tanstack/react-router";

export const columns: ColumnDef<DatamanagerResource>[] = [
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

export function DatamanagerTable() {
  const { data: dmList } = useFdk({
    env: "stage",
    action: "dmList",
  });
  const navigate = useNavigate();
  return (
    <div className="container mx-auto py-10">
      <DataTable
        columns={columns}
        data={dmList?.items || []}
        // onClick={(row) => navigate(`/dm/${row.original.dataManagerID}/model`)}
        // onClick={(row) => navigate({to: `/dm/${row.original.dataManagerID}/model`})}
        onClick={(row) =>
          navigate({
            to: `/d/$shortID/model`,
            params: { shortID: row.original.shortID },
          })
        }
      />
    </div>
  );
}
