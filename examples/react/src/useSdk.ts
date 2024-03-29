// @ts-ignore
import { act, query, auth } from "ec.fdk";
import useSWR from "swr";

export function useSdk(config: any) {
  const key = config ? query(config) : null;
  return useSWR([key], () => act(config));
}
