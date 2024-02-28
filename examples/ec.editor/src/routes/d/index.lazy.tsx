import { createLazyFileRoute } from "@tanstack/react-router";
import { DatamanagerTable } from "../../components/DatamanagerTable";

export const Route = createLazyFileRoute("/d/")({
  component: DatamanagerTable,
});
