import { useOidc } from "@axa-fr/react-oidc";

export function MainLayout({ children }: React.PropsWithChildren<{}>) {
  const { logout } = useOidc();
  return (
    <div>
      <div className="flex justify-between">
        {/* <Breadcrumbs /> */}
        {/* <button onClick={() => navigate("/")}>dmList</button> */}
        <button onClick={() => logout("/")}>Logout</button>
      </div>
      <div>{children}</div>
    </div>
  );
}
