import json
import select
import sys


def listen(callback):
    """
    监听标准输入，当有输入时，调用回调函数处理输入数据。

    参数:
    - callback: 一个函数，用于处理输入数据。当标准输入有新数据时，这个函数将被调用，并传入读取到的数据作为参数。
    """
    # 获取标准输入的文件描述符，用于后续的select操作
    sys.stdin.fileno()
    while True:
        # 使用select检查标准输入是否准备好读取，避免阻塞
        if select.select([sys.stdin], [], [], 0)[0]:
            # 读取标准输入的数据
            data = sys.stdin.readline()
            # 调用回调函数处理读取到的数据
            callback(data)


def send(data):
    """
    将数据发送到外部系统或服务。

    此函数通过将数据转换为JSON格式的字符串，并写入标准输出，来实现数据的发送。
    这种做法通常用于命令行工具或API接口，以一种可读且标准化的方式输出数据。

    参数:
    - data: 需要发送的数据，可以是任何Python对象。函数将尝试将其转换为JSON格式。

    返回值:
    无返回值。此函数通过标准输出直接发送数据。
    """
    sys.stdout.writelines(json.dumps({"result": data}))


def error(msg):
    """
    向标准错误输出错误信息。

    此函数旨在将错误消息写入标准错误输出流，而不是标准输出流。
    这有助于将错误信息与正常程序输出分离，便于错误日志记录和问题追踪。

    参数:
    msg: str - 要输出的错误消息。
    """
    sys.stderr.writelines(msg)
