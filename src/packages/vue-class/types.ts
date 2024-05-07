import {
  type ComponentCustomProps,
  type EmitsOptions,
  type Prop,
  type SetupContext,
  type StyleValue,
  type VNodeChild,
  type VNodeProps,
} from "vue";
import type { VueComponent, VueComponentBaseProps } from "./vue-component";

export type VueComponentClass<
  Props extends VueComponentBaseProps = VueComponentBaseProps,
  Emit extends EmitsOptions = {},
> = {
  new (...args: any[]): VueComponent<Props>;
  defineProps: ComponentProps<Props>;
  // defineEmits: DefineEmits<Emit>;
};

export type DefineEmits<Emit extends EmitsOptions> = Array<keyof Emit>;

type KeysOfUnion<T> = T extends T ? keyof T : never;

type DefaultSlots = {
  default(): VNodeChild;
};

type MixDefaultSlots<T extends {}> = "default" extends keyof T
  ? {}
  : DefaultSlots;

// 处理tsx slots 类型问题
export type WithVSlots<T extends Record<string, any>> = {
  "v-slots"?: "slots" extends keyof T
    ? Partial<T["slots"] & { $stable: boolean } & MixDefaultSlots<T["slots"]>>
    : Partial<{ $stable: boolean; default(): VNodeChild }>;
};

export type WithSlotTypes<Emit extends EmitsOptions, T extends {}> = Omit<
  SetupContext<Emit>,
  "slots"
> & {
  slots: NonNullable<VueComponentProps<T>["v-slots"]>;
};

type ModelProps<T extends {}> = Exclude<
  {
    [Prop in keyof T]: T extends {
      [k in Prop as `onUpdate:${k & string}`]?: any;
    }
      ? Prop
      : never;
  }[keyof T],
  undefined
>;

export type WithVModel<
  T extends {},
  U extends keyof T = ModelProps<T>,
> = TransformModelValue<{
  [k in U as `v-model:${k & string}`]?: T[k] | [T[k], string[]];
}>;
export type TransformModelValue<T extends {}> =
  "v-model:modelValue" extends keyof T
    ? Omit<T, "v-model:modelValue"> & { ["v-model"]?: T["v-model:modelValue"] }
    : T;

export type ComponentProps<T extends {}> =
  | ComponentPropsObject<T>
  | Array<KeysOfUnion<DistributiveOmit<T, "slots">>>;

export type ComponentPropsObject<T extends {}> = {
  [U in KeysOfUnion<DistributiveOmit<T, "slots">>]-?: Prop<any>;
};

export type ComponentSlots<T extends { props: any }> = NonNullable<
  T["props"]["v-slots"]
>;

export type AllowedComponentProps = {
  class?: any;
  style?: StyleValue;
  [name: string]: any;
};

export type DistributiveOmit<T, K extends keyof any> = T extends T
  ? Omit<T, K>
  : never;

type DistributiveVModel<T extends {}> = T extends T ? WithVModel<T> : never;
type DistributiveVSlots<T extends {}> = T extends T ? WithVSlots<T> : never;

export type VueComponentProps<T extends {}> = DistributiveOmit<T, "slots"> &
  DistributiveVModel<T> &
  DistributiveVSlots<T> &
  VNodeProps &
  AllowedComponentProps &
  ComponentCustomProps;
