import { findIdenticalByRawComparing } from "./find_identical";
import { cpus } from "os";

const path = "./input";
const threadsCount = cpus().length;

findIdenticalByRawComparing(path, threadsCount).then((value) => {
  console.log(JSON.stringify(value, null, 2))
});