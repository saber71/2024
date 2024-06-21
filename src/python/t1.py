import json
import sys

sys.stdout.writelines(json.dumps({"result": {"value": "Hello World"}}))
