import type {
  Client as WhatsAppClient,
  GroupChat,
  Message,
} from "npm:whatsapp-web.js";
import type { IWhatsAppService } from "../core/types.ts";
import { PermissionLevel } from "../core/types.ts";

export class WhatsAppService implements IWhatsAppService {
  constructor(private client: WhatsAppClient) {}

  getClient(): WhatsAppClient {
    return this.client;
  }

  async isAdmin(message: Message): Promise<boolean> {
    const chat = await message.getChat();
    if (!chat.isGroup) return true;

    const contact = await message.getContact();
    const groupChat = chat as GroupChat;
    const participant = groupChat.participants.find((p) =>
      p.id._serialized === contact.id._serialized
    );

    return participant?.isAdmin || participant?.isSuperAdmin || false;
  }

  async getPermissionLevel(message: Message): Promise<PermissionLevel> {
    const chat = await message.getChat();

    // Se não for um grupo, considera que tem permissão máxima (conversa privada)
    if (!chat.isGroup) return PermissionLevel.OWNER;

    const contact = await message.getContact();
    const groupChat = chat as GroupChat;
    const participant = groupChat.participants.find((p) =>
      p.id._serialized === contact.id._serialized
    );

    if (participant?.isSuperAdmin) {
      return PermissionLevel.OWNER;
    } else if (participant?.isAdmin) {
      return PermissionLevel.ADMIN;
    } else {
      return PermissionLevel.EVERYONE;
    }
  }
}
