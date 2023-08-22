// @ts-ignore
import { act, query } from "../../src/index.mjs";
import useSWR from "swr";

export default function useSdk(config: any) {
  const key = config ? query(config) : null;
  return useSWR([key], () => act(config));
}
