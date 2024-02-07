import { useOidc } from "@axa-fr/react-oidc";
import { act } from "ec.fdk/dist/index.mjs"; // in a real project, this would just be "ec.fdk"
import { useFdk } from "../useFdk";

export function Hello() {
  const { logout } = useOidc();

  const { data: dmList } = useFdk({
    env: "stage",
    action: "dmList",
  });
  console.log("dmList", dmList);

  return (
    <div>
      <button
        onClick={async () => {
          const dms = await act({ env: "stage", action: "dmList" });
          console.log("req", dms);
        }}
      >
        Request
      </button>
      <button onClick={() => logout("/")}>Logout</button>
    </div>
  );
}
