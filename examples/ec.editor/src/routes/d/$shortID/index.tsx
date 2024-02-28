import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/d/$shortID/")({
  component: () => <div>Hello /d/$shortID/!</div>,
});
