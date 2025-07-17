import type { Contact, GroupChat, Message } from "npm:whatsapp-web.js";
import type { ICommand, IWhatsAppService } from "../core/types.ts";
import { PermissionLevel } from "../core/types.ts";

export class GroupInfoCommand implements ICommand {
  name = "groupinfo";
  description = "Exibe informações de todos os participantes do grupo";
  requiredPermission = PermissionLevel.OWNER;

  constructor(private whatsappService: IWhatsAppService) {}

  async execute(
    message: Message,
    _args: string[],
    _whatsappService: IWhatsAppService,
  ): Promise<void> {
    const chat = await message.getChat();
    if (!chat.isGroup) {
      await message.reply("❌ Este comando só funciona em grupos!");
      return;
    }

    const groupChat = chat as GroupChat;
    let infoText = `👥 *Participantes do grupo "${groupChat.name}":*\n\n`;

    for (const participant of groupChat.participants) {
      const contact = await this.whatsappService.getClient().getContactById(
        participant.id._serialized,
      ) as Contact;
      const adminMark = participant.isSuperAdmin
        ? "👑 (Dono)"
        : participant.isAdmin
        ? "⭐ (Admin)"
        : "";
      infoText += `• ${
        contact.pushname || contact.name || contact.number ||
        participant.id.user
      } ${adminMark}\n`;
    }

    await message.reply(infoText.trim());
  }
}
