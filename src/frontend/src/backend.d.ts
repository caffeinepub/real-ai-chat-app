import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Message {
    id: bigint;
    content: string;
    role: Role;
    timestamp: Time;
}
export type Time = bigint;
export enum Role {
    user = "user",
    assistant = "assistant"
}
export interface backendInterface {
    clearHistory(): Promise<void>;
    createConversation(name: string): Promise<bigint>;
    getCurrentConversationId(): Promise<bigint>;
    getHistory(): Promise<Array<Message>>;
    listConversations(): Promise<Array<[bigint, string]>>;
    sendMessage(message: string): Promise<string>;
    switchConversation(id: bigint): Promise<void>;
}
