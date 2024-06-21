import EventEmitter from "eventemitter3"
import * as child_process from "node:child_process"
import { basename } from "node:path"

/**
 * 存储已知Python可执行文件路径的映射。
 */
const exePaths: Record<string, string> = {}

/**
 * 初始化Python可执行文件的路径。
 */
await initExePaths()

/**
 * 启动一个Python进程并返回一个PythonProcess实例。
 * @param {string} name Python脚本的名称。
 * @param {...any[]} args 传递给Python脚本的参数。
 * @returns {PythonProcess} 一个用于与Python进程通信的实例。
 * @throws {Error} 如果找不到对应的Python可执行文件，则抛出错误。
 */
export function execPython(name: string, ...args: any[]): PythonProcess {
  const path = exePaths[name]
  if (!path) throw new Error("Python executable not found")
  const ps = child_process.spawn(path, args)
  return new PythonProcess(ps)
}

/**
 * 异步初始化Python可执行文件的路径映射。
 */
async function initExePaths() {
  const pythonExes = import.meta.glob("../../../resources/python/*", { query: "?asset", import: "default" })
  for (let fn of Object.values(pythonExes)) {
    const path = (await fn()) as string
    const fileName = basename(path)
    exePaths[fileName] = path
  }
}

/**
 * 表示一个与Python进程通信的进程。
 * @template {any} Result 事件数据的类型。
 */
export class PythonProcess<Result = any> extends EventEmitter<{
  data: (data: Result) => void
  error: (msg: string) => void
}> {
  /**
   * 创建一个PythonProcess实例。
   * @param {child_process.ChildProcessWithoutNullStreams} ps 与Python进程对应的Node.js子进程。
   */
  constructor(readonly ps: child_process.ChildProcessWithoutNullStreams) {
    super()
    this._listenData()
    this._listenError()
  }

  /**
   * 向Python进程发送数据，并返回一个Promise。
   * @param {string} data 要发送的数据。
   */
  sendData(data: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.ps.stdin.write(data + "\n", (error) => {
        if (error) reject(error)
        else resolve()
      })
    })
  }

  /**
   * 监听Python进程的标准输出数据，并将其作为结果事件发出。
   */
  private _listenData() {
    const chunks: Buffer[] = []
    this.ps.stdout.on("data", (data) => chunks.push(data))
    this.ps.stdout.on("end", () => {
      const data = JSON.parse(Buffer.concat(chunks).toString()) as { result: Result }
      this.emit("data", data.result)
    })
  }

  /**
   * 监听Python进程的标准错误输出，并将其作为错误事件发出。
   */
  private _listenError() {
    const chunks: Buffer[] = []
    this.ps.stderr.on("data", (data) => chunks.push(data))
    this.ps.stderr.on("end", () => {
      this.emit("error", Buffer.concat(chunks).toString())
    })
  }
}
