import { act, query } from "ec.fdk";
import useSWR from "swr";

export function useFdk(config: any) {
  const key = config ? query(config) : null;
  console.log("config", config);
  return useSWR([key], () => act(config));
}
