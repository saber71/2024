import "reflect-metadata"
import type { Class } from "../common"
import { Metadata } from "./metadata"
import type { InjectableOptions, InjectOptions, MethodParameterOption, MethodParameterTypes } from "./types"

/* 透过装饰器第二个参数获取被装饰者名字 */
export function getDecoratedName(ctx?: string | ClassMemberDecoratorContext) {
  if (typeof ctx === "string") return ctx
  return ctx?.name ?? ""
}

/* 填充方法指定的入参类型和自定义getter函数 */
export function fillInMethodParameterTypes(
  parameterTypes: MethodParameterTypes,
  option?: MethodParameterOption,
  types?: Function[]
) {
  if (!option?.paramtypes && !option?.paramGetters && !types)
    throw new InjectNotFoundTypeError("无法通过元数据获取方法入参类型，必须指定类型")
  if (option) {
    if (option.paramtypes) {
      for (let index in option.paramtypes) {
        const i = Number(index)
        if (parameterTypes.types[i]) continue
        parameterTypes.types[i] = option.paramtypes[index]
      }
    }
    if (option.paramGetters) {
      for (let index in option.paramGetters) {
        if (parameterTypes.getters[index]) continue
        parameterTypes.getters[index] = option.paramGetters[index]
      }
    }
  }
  if (types) {
    for (let i = 0; i < types.length; i++) {
      if (parameterTypes.types[i]) continue
      parameterTypes.types[i] = types[i].name
    }
  }
}

/**
 * 类装饰器。获取类的构造函数的入参类型，标记该类可以被依赖注入
 * 如果父类没有用Injectable装饰，那么子类就必须要声明构造函数，否则的话无法通过元数据得到子类正确的构造函数入参类型
 */
export function Injectable(option?: InjectableOptions) {
  return (clazz: Class, ctx?: any) => {
    const metadata = Metadata.getOrCreate(clazz)
    metadata.injectable = true
    metadata.moduleName = option?.moduleName
    metadata.singleton = option?.singleton
    metadata.createImmediately = option?.createImmediately
    metadata.overrideParent = option?.overrideParent
    metadata.onCreate = option?.onCreate
    const parameterTypes = metadata.getMethodParameterTypes()
    const designParameterTypes = Reflect.getMetadata("design:paramtypes", clazz)
    const overrideConstructor = option?.overrideConstructor ?? true
    if (!overrideConstructor && metadata.copiedConstructorParams) return
    /* 如果构造函数有定义，就清空从父类处继承来的构造函数入参类型信息 */
    if (designParameterTypes && metadata.copiedConstructorParams) {
      metadata.copiedConstructorParams = false
      parameterTypes.types.length = 0
      parameterTypes.getters = {}
    }
    fillInMethodParameterTypes(parameterTypes, option, designParameterTypes ?? [])
  }
}

/**
 * 参数装饰器、属性装饰器，方法装饰器。
 * 当装饰方法时，获取方法的入参类型。当装饰属性时，获取数的入参类型。当装饰方法的入参时，用来指定该入参的类型，会覆盖方法装饰器中所指定的类型
 * @param option.typeLabel 指定被装饰的字段或入参的类型。当被装饰的是类的字段或入参时才生效
 * @param option.typeValueGetter 指定被装饰的字段或入参的自定义getter。当被装饰的是类的字段或入参时才生效
 * @throws InjectNotFoundTypeError 在无法确定被装饰者的类型时抛出
 */
export function Inject(option?: InjectOptions | string) {
  return (clazz: any, propName: ClassFieldDecoratorContext | any, index?: any) => {
    propName = getDecoratedName(propName) || "constructor"
    const typeLabel = typeof option === "string" ? option : option?.typeLabel
    if (typeof option === "string") option = {}
    const typeValueGetter = option?.typeValueGetter
    if (typeof index === "number") {
      /* 构造函数或方法的参数装饰器 */
      const metadata = Metadata.getOrCreate(clazz)
      const methodParameterTypes = metadata.getMethodParameterTypes(propName)

      /* 如果已有的构造函数入参是从父类继承的，就清空这些类型信息 */
      if (propName === "constructor" && metadata.copiedConstructorParams) {
        metadata.copiedConstructorParams = false
        methodParameterTypes.types.length = 0
        methodParameterTypes.getters = {}
      }

      if (typeLabel) methodParameterTypes.types[index] = typeLabel
      if (typeValueGetter) methodParameterTypes.getters[index] = typeValueGetter

      option?.afterExecute?.(metadata, metadata.clazz.name, propName, index)
    } else {
      /* 属性或方法装饰器 */
      const metadata = Metadata.getOrCreate(clazz)
      const types = Reflect.getMetadata("design:paramtypes", clazz, propName)
      if (types) {
        /* 方法装饰器 */
        const methodParameterTypes = metadata.getMethodParameterTypes(propName)
        fillInMethodParameterTypes(methodParameterTypes, option, types)
        if (option?.beforeCallMethod) methodParameterTypes.beforeCallMethods.push(option.beforeCallMethod)
        if (option?.afterCallMethod) methodParameterTypes.afterCallMethods.push(option.afterCallMethod)
      } else {
        /* 属性装饰器 */
        const type = typeLabel || Reflect.getMetadata("design:type", clazz, propName)?.name
        if (!type && !typeValueGetter) throw new InjectNotFoundTypeError("无法通过元数据获取字段类型，必须指定类型")
        metadata.fieldTypes[propName] = { type, getter: typeValueGetter }
      }
      option?.afterExecute?.(metadata, metadata.clazz.name, propName)
    }
  }
}

export function BeforeCallMethod(cb: InjectOptions["beforeCallMethod"]) {
  return (target: any, methodName: any) => {
    methodName = getDecoratedName(methodName)
    const metadata = Metadata.getOrCreate(target)
    const methodParameterTypes = metadata.getMethodParameterTypes(methodName)
    methodParameterTypes.beforeCallMethods.push(cb)
  }
}

export function AfterCallMethod(cb: InjectOptions["afterCallMethod"]) {
  return (target: any, methodName: any) => {
    methodName = getDecoratedName(methodName)
    const metadata = Metadata.getOrCreate(target)
    const methodParameterTypes = metadata.getMethodParameterTypes(methodName)
    methodParameterTypes.afterCallMethods.push(cb)
  }
}

/* 在装饰器Inject无法确定被装饰者类型时抛出 */
export class InjectNotFoundTypeError extends Error {}
