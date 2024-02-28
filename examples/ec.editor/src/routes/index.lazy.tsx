import { createLazyFileRoute } from "@tanstack/react-router";
import { DatamanagerTable } from "../components/DatamanagerTable";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="p-2">
      <DatamanagerTable />
    </div>
  );
}
