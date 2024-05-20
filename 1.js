import * as url from "node:url"
import path from "node:path"

console.log(url.pathToFileURL('D:\\WebstormProjects\\2024\\resources\\icon.png').href,path.normalize('D:\\WebstormProjects\\2024\\resources\\icon.png'),decodeURI('D:\\WebstormProjects\\2024\\resources\\icon.png'))
