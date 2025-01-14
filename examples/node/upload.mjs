import { sdk } from "ec.fdk";
import fs from "node:fs";
import { Blob } from "node:buffer";

async function run() {
  const buf = fs.readFileSync("venndiagram.png");
  const file = new Blob([buf]);
  const upload = await fdk("stage")
    .dm("83cc6374")
    .assetgroup("test")
    .createAsset({ file, name: "venndiagram.png" });
  console.log("upload", upload);
}

run();
