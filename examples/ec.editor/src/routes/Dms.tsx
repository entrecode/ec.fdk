import { useOidc } from "@axa-fr/react-oidc";
import { DatamanagerTable } from "../components/DatamanagerTable";

export function Dms() {
  const { logout } = useOidc();
  return (
    <div>
      <div className="flex justify-between">
        <p></p>
        {/* <button onClick={() => navigate("/")}>dmList</button> */}
        <button onClick={() => logout("/")}>Logout</button>
      </div>
      <DatamanagerTable />
    </div>
  );
}
