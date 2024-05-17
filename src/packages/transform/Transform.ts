import EventEmitter from "eventemitter3";
import { mat2d } from "./mat2d";
import type { ReadonlyVec2, Vec2 } from "./types";
import { vec2 } from "./vec2";

const scratchInverseWorld = mat2d.create();

export class Transform extends EventEmitter<{
  worldMatrixUpdated: () => void;
  parentChanged: () => void;
}> {
  protected _defaultParent?: Transform;
  protected _localMatrix = mat2d.create();
  protected _needUpdateLocalMatrix: boolean = true;
  protected _needUpdateWorldMatrix: boolean = true;
  protected _origin = vec2.create();
  protected _parent?: Transform;
  protected _rotation: number = 0;
  protected _scale = vec2.fromValues(1, 1);
  protected _translate = vec2.create();
  protected _translateOffset = vec2.create();
  protected _worldMatrix = mat2d.create();

  constructor(defaultParent?: Transform) {
    super();
    this._defaultParent = defaultParent;
  }

  copyFrom(src: Transform): this {
    const translation = src.getTranslation();
    const scale = src.getScale();
    const offset = src.getTranslateOffset();
    const origin = src.getOrigin();
    return this.translateTo(translation[0], translation[1])
      .scaleTo(scale[0], scale[1])
      .rotateTo(src.getRotation())
      .setTranslateOffset(offset[0], offset[1])
      .setOrigin(origin[0], origin[1]);
  }

  getLocalMatrix() {
    if (this._needUpdateLocalMatrix) {
      this._needUpdateLocalMatrix = false;
      this._computeLocalMatrix();
    }
    return this._localMatrix;
  }

  getOrigin() {
    return this._origin;
  }

  getParent() {
    return this._parent;
  }

  getRotation(): number {
    return this._rotation;
  }

  getScale() {
    return this._scale;
  }

  getTranslateOffset(): ReadonlyVec2 {
    return this._translateOffset;
  }

  getTranslation() {
    return this._translate;
  }

  getWorldMatrix() {
    if (this._needUpdateWorldMatrix) {
      this._needUpdateWorldMatrix = false;
      this._computeWorldMatrix();
    }
    return this._worldMatrix;
  }

  refreshMatrix(): this {
    const exist = !this._needUpdateLocalMatrix || !this._needUpdateWorldMatrix;
    this._needUpdateLocalMatrix = this._needUpdateWorldMatrix = true;
    if (exist) this.emit("worldMatrixUpdated");
    return this;
  }

  rotate(angle: number): this {
    if (angle === 0) return this;
    this._rotation += angle;
    return this.refreshMatrix();
  }

  rotateByDegree(degree: number): this {
    return this.rotate((degree / 180) * Math.PI);
  }

  rotateTo(angle: number): this {
    return this.rotate(angle - this._rotation);
  }

  rotateToByDegree(degree: number): this {
    return this.rotateTo((degree / 180) * Math.PI);
  }

  scale(x: number, y: number): this {
    if (x === 0 && y === 0) return this;
    this._scale = vec2.fromValues(this._scale[0] + x, this._scale[1] + y);
    return this.refreshMatrix();
  }

  scaleTo(x: number, y: number): this {
    return this.scale(x - this._scale[0], y - this._scale[1]);
  }

  setDefaultParent(val?: Transform): this {
    if (val === this._defaultParent) return this;
    const prevDefaultParent = this._defaultParent;
    this._defaultParent = val;
    if (!this._parent && val) this.setParent(this._defaultParent);
    else if (prevDefaultParent === this._parent)
      this.setParent(this._defaultParent);
    return this;
  }

  setOrigin(x: number, y: number): this {
    if (x !== this._origin[0] || y !== this._origin[1]) {
      this._origin = vec2.fromValues(x, y);
      this.refreshMatrix();
    }
    return this;
  }

  setParent(parent?: Transform): this {
    const changed = parent !== this._parent;
    if (!changed) return this;
    if (this._parent) {
      this._parent.off(
        "worldMatrixUpdated",
        this._onParentUpdateWorldMatrix,
        this,
      );
    }
    this._parent = parent ?? this._defaultParent;
    if (this._parent)
      this._parent.on(
        "worldMatrixUpdated",
        this._onParentUpdateWorldMatrix,
        this,
      );
    if (changed) this.emit("parentChanged");
    return this.refreshMatrix();
  }

  setTranslateOffset(x: number, y: number): this {
    if (x === this._translateOffset[0] && y === this._translateOffset[1])
      return this;
    this._translateOffset[0] = x;
    this._translateOffset[1] = y;
    return this.refreshMatrix();
  }

  toLocal(p: Vec2, out = vec2.create()) {
    mat2d.invert(scratchInverseWorld, this.getWorldMatrix());
    return vec2.transformMat2d(out, p, scratchInverseWorld);
  }

  toStringLocal() {
    return mat2d.str(this.getLocalMatrix());
  }

  toStringWorld() {
    return mat2d.str(this.getWorldMatrix());
  }

  toWorld(p: Vec2, out = vec2.create()) {
    return vec2.transformMat2d(out, p, this.getWorldMatrix());
  }

  translate(x: number, y: number): this {
    if (x === 0 && y === 0) return this;
    this._translate[0] += x;
    this._translate[1] += y;
    return this.refreshMatrix();
  }

  translateTo(
    x: number = this._translate[0],
    y: number = this._translate[1],
  ): this {
    return this.translate(x - this._translate[0], y - this._translate[1]);
  }

  protected _computeLocalMatrix(): void {
    const anchor = this._origin;
    mat2d.identity(this._localMatrix);
    mat2d.translate(
      this._localMatrix,
      this._localMatrix,
      vec2.fromValues(
        anchor[0] +
          this._translate[0] +
          this._translateOffset[0] * this._scale[0],
        anchor[1] +
          this._translate[1] +
          this._translateOffset[1] * this._scale[1],
      ),
    );
    mat2d.rotate(this._localMatrix, this._localMatrix, this._rotation);
    mat2d.scale(this._localMatrix, this._localMatrix, this._scale);
    mat2d.translate(
      this._localMatrix,
      this._localMatrix,
      vec2.fromValues(-anchor[0], -anchor[1]),
    );
  }

  protected _computeWorldMatrix(): void {
    if (this._parent) {
      mat2d.copy(this._worldMatrix, this._parent.getWorldMatrix());
      mat2d.multiply(
        this._worldMatrix,
        this._worldMatrix,
        this.getLocalMatrix(),
      );
    } else {
      mat2d.copy(this._worldMatrix, this.getLocalMatrix());
    }
  }

  protected _onParentUpdateWorldMatrix() {
    this.refreshMatrix();
  }
}
