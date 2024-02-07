import { useOidc } from "@axa-fr/react-oidc";
import { DatamanagerTable } from "../components/DatamanagerTable";

export function Hello() {
  const { logout } = useOidc();
  return (
    <div>
      <button onClick={() => logout("/")}>Logout</button>
      <DatamanagerTable />
    </div>
  );
}
