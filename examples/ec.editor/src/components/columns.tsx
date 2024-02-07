"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { DatamanagerResource } from "ec.fdk/dist/index.d.mts";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

export const columns: ColumnDef<DatamanagerResource>[] = [
  {
    accessorKey: "created",
    header: "Created",
  },
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
];
