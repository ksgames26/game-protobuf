import { _decorator, assert, js } from "cc";
import { DEBUG } from "cc/env";
import { implementation } from "db://game-core/game-framework";
import { MessageType } from "./game-framework";
const { ccclass } = _decorator;

export * from "./protobuf-ts/index";

/**
 * 游戏框架默认的protobuf序列化器
 *
 * @export
 * @class ProtobufSerializer
 * @implements {IGameFramework.ISerializable}
 */

@ccclass("ProtobufSerializer")
@implementation("IGameFramework.ISerializable")
export class ProtobufSerializer implements IGameFramework.ISerializable {

    private _map = new Map<string | number, unknown>();

    public registerType<T extends IGameFramework.ISerializer>(clazz: IGameFramework.Constructor<T>): void {
        let inst = new clazz();
        this.registerInst(inst);
    }

    public registerInst<T extends IGameFramework.ISerializer>(inst: T): void {
        DEBUG && assert(!this._map.has(inst.protoId), `ProtobufSerializer: ${inst.protoId} is already registered.`);
        this._map.set(inst.protoId, inst);
    }

    /**
     * 打包
     *
     * @template T
     * @param {T} clazz
     * @return {*}  {Uint8Array}
     * @memberof ProtobufSerializer
     */
    public encoder<T extends IGameFramework.ISerializer>(clazz: T): Uint8Array {
        // 如果需要打包的实例是通过IGameFramework.ISerializable.create创建的那么这里拿到protoId是一定的
        const protoId = clazz.protoId;
        DEBUG && assert(!protoId, `ProtobufSerializer: ${js.getClassName(clazz)} prototype protoId is undefined`);
        let message = this._map.get(protoId) as MessageType<object>;
        DEBUG && assert(!message, `ProtobufSerializer: ${protoId} is undefined`);
        return message.toBinary(message);
    }

    /**
     * 拆包
     *
     * @template T
     * @param {(string | number)} protoId
     * @param {Uint8Array} buffer
     * @return {*}  {T}
     * @memberof ProtobufSerializer
     */
    public decoder<T extends IGameFramework.ISerializer>(protoId: string | number, buffer: Uint8Array): T {
        let message = this._map.get(protoId) as MessageType<object>;
        return message.fromBinary(buffer) as T;
    }

    /**
     * 创建一个可以打包解包的结构实例，非类实例
     *
     * @template T
     * @param {(string | number)} protoId
     * @return {*}  {T}
     * @memberof ProtobufSerializer
     */
    public create<T extends IGameFramework.ISerializer>(protoId: string | number): T {
        let message = this._map.get(protoId) as MessageType<object>;
        let msg = message.create() as T;

        // 因为create创建的是一个json结构体而非MessageType的子类型
        // 需要手动将protoId赋值给msg
        // 接口定义里面并没有给到设值protoId的方法
        // 这里通过将readonly - writable的方式来注入这个protoId
        (msg as IGameFramework.Writable<T>).protoId = protoId;
        return msg;
    }

    /**
     * 克隆一个对象
     *
     * @template T
     * @param {(string | number)} id
     * @param {T} source
     * @return {*}  {T}
     * @memberof ISerializable
     */
    public clone<T>(protoId: string | number, source: T): T {
        let message = this._map.get(protoId) as MessageType<object>;
        let msg = message.clone(source as object) as T;

        // 因为create创建的是一个json结构体而非MessageType的子类型
        // 需要手动将protoId赋值给msg
        // 接口定义里面并没有给到设值protoId的方法
        // 这里通过将readonly - writable的方式来注入这个protoId
        (msg as IGameFramework.Writable<IGameFramework.ISerializer>).protoId = protoId;
        return msg;
    }
}