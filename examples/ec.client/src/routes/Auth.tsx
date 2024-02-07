import { useOidc } from "@axa-fr/react-oidc";

export function Auth() {
  const { logout, login, isAuthenticated } = useOidc();
  if (isAuthenticated) {
    return <button onClick={() => logout("/")}>Logout</button>;
  }
  return <button onClick={() => login("/")}>Login</button>;
}
