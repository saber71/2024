import { exiftool } from "exiftool-vendored"

const filePath = "/home/exa88/Pictures/1.png"
exiftool
  .read(filePath)
  .then((tags /*: Tags */) => console.log(tags))
  .catch((err) => console.error("Something terrible happened: ", err))
