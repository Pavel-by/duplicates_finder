import { findIdenticalByRawComparing } from "./find_identical";

const path = "./input";
const threadsCount = 10;

findIdenticalByRawComparing(path, threadsCount).then((value) => {
  console.log(JSON.stringify(value, null, 2))
});