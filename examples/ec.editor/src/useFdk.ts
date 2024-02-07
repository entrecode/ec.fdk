import { act, query } from "ec.fdk";
import useSWR from "swr";

export function useFdk(config: any) {
  const key = config ? query(config) : null;
  return useSWR([key], () => act(config));
}
