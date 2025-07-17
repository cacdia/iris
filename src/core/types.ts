import type { Client as WhatsAppClient, Message } from "npm:whatsapp-web.js";

export enum PermissionLevel {
  EVERYONE = 0,
  ADMIN = 1,
  OWNER = 2,
}

export interface IMessageHandler {
  handle(message: Message): Promise<void>;
}

export interface IWhatsAppService {
  getClient(): WhatsAppClient;
  isAdmin(message: Message): Promise<boolean>;
  getPermissionLevel(message: Message): Promise<PermissionLevel>;
}

export interface ICommand {
  name: string;
  description: string;
  requiredPermission: PermissionLevel;
  execute(
    message: Message,
    args: string[],
    services: IWhatsAppService,
  ): Promise<void>;
}

export interface ICommandRegistry {
  register(command: ICommand): void;
  get(name: string): ICommand | undefined;
  getAll(): readonly ICommand[];
}

export interface IPauseService {
  pause(groupId: string, minutes: number): void;
  unpause(groupId: string): boolean;
  isPaused(groupId: string): boolean;
}
