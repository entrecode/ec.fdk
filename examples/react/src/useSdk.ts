// @ts-ignore
import { act, query, auth } from "ec.fdk";
import useSWR from "swr";

auth.listen((v: any) => {
  console.log("auth changed", v);
  /* const { dmShortID, env } = ecadmin.config;
  const { token } = v[env] || v[dmShortID] || {};
  console.log("token", token);
  ecadmin = ecadmin.token(token); */
});

export function useSdk(config: any) {
  const key = config ? query(config) : null;
  return useSWR([key], () => act(config));
}
