import type { GroupChat, Message } from "npm:whatsapp-web.js";
import type { ICommand, IWhatsAppService } from "../core/types.ts";
import { PermissionLevel } from "../core/types.ts";
import { PauseService } from "../services/pause.service.ts";

export class UnpauseCommand implements ICommand {
  name = "unpause";
  description = "Despausa o grupo antes do tempo programado";
  requiredPermission = PermissionLevel.ADMIN;

  constructor(private pauseService: PauseService) {}

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
    const groupId = groupChat.id._serialized;

    if (!this.pauseService.unpause(groupId)) {
      await message.reply("❌ O grupo não está pausado.");
      return;
    }

    try {
      const success = await groupChat.setMessagesAdminsOnly(false);

      if (!success) {
        await message.reply(
          "❌ Não foi possível despausar o grupo. Verifique se tenho permissões de administrador.",
        );
        return;
      }

      await message.reply(
        "▶️ *Grupo despausado*\n\nTodos os participantes podem enviar mensagens novamente.",
      );
    } catch (error) {
      console.error("Erro ao despausar grupo:", error);
      await message.reply("❌ Erro interno ao despausar o grupo.");
    }
  }
}
