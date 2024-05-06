export function If<Result>(cond: Condition): If<Result> {
  const record: Record = {
    if: { then: undefined, checkResult: checkCondition(cond) },
    elseIf: [],
  };
  const object: If<Result> = {
    then(value: Value<Result>) {
      if (record.if.then === undefined) record.if.then = value;
      else if (record.else) {
        if (!record.else.then) record.else.then = value;
      } else {
        const lastElseIf = record.elseIf.at(-1);
        if (lastElseIf) lastElseIf.then = value;
      }
      return this;
    },
    else(value: Value<Result>) {
      if (!record.else) record.else = {} as any;
      record.else!.then = value;
      return object.done();
    },
    elseIf(cond: Condition) {
      record.elseIf.push({ then: undefined, cond });
      return this;
    },
    done(): Result {
      let result: Result;
      if (record.if.checkResult) result = getValue(record.if.then);
      else {
        let gotIt = false;
        for (let item of record.elseIf) {
          if (checkCondition(item.cond)) {
            result = getValue(item.then);
            gotIt = true;
            break;
          }
        }
        if (!gotIt) result = getValue(record.else);
      }
      return result!;
    },
  };
  return object;
}

interface Record {
  if: { then: Value; checkResult: boolean };
  else?: { then: Value };
  elseIf: Array<{ then: Value; cond: Condition }>;
}

interface If<Result = any> {
  then(value: Value<Result>): this;

  else(value: Value<Result>): Result;

  elseIf(cond: Condition): this;

  done(): Result;
}

type Condition = boolean | (() => boolean);
type Value<Result = any> = Result | (() => Result);

function checkCondition(cond: Condition) {
  if (typeof cond === "function") return cond();
  return cond;
}

function getValue(val: Value) {
  if (typeof val === "function") return val();
  return val;
}
