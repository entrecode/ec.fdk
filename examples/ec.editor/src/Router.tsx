import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./index.css";
import { Dms } from "./routes/Dms.tsx";
import { Entries } from "./routes/Entries.tsx";
import { Entry } from "./routes/Entry.tsx";
import { Models } from "./routes/Models.tsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Dms />,
  },
  {
    path: "/dm/:shortID/model",
    element: <Models />,
  },
  {
    path: "/dm/:shortID/model/:model/entry",
    element: <Entries />,
  },
  {
    path: "/dm/:shortID/model/:model/entry/:entryID",
    element: <Entry />,
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
