import type { GroupChat, Message } from "npm:whatsapp-web.js";
import type { ICommand, IWhatsAppService } from "../core/types.ts";
import { PermissionLevel } from "../core/types.ts";
import { PauseService } from "../services/pause.service.ts";

export class PauseCommand implements ICommand {
  name = "pause";
  description = "Pausa o grupo para apenas admins por N minutos (ex: !pause 5)";
  requiredPermission = PermissionLevel.ADMIN;

  constructor(private pauseService: PauseService) {}

  async execute(
    message: Message,
    args: string[],
    _whatsappService: IWhatsAppService,
  ): Promise<void> {
    const chat = await message.getChat();
    if (!chat.isGroup) {
      await message.reply("❌ Este comando só funciona em grupos!");
      return;
    }

    const groupChat = chat as GroupChat;
    const groupId = groupChat.id._serialized;

    if (this.pauseService.isPaused(groupId)) {
      await message.reply(
        "⏸️ O grupo já está pausado. Use !unpause para despausar.",
      );
      return;
    }

    const minutes = parseInt(args[0]);
    if (!args[0] || isNaN(minutes) || minutes <= 0 || minutes > 1440) {
      await message.reply(
        "❌ Use: !pause <minutos>\nExemplo: !pause 5\n(Máximo: 1440 minutos)",
      );
      return;
    }

    try {
      const success = await groupChat.setMessagesAdminsOnly(true);

      if (!success) {
        await message.reply(
          "❌ Não foi possível pausar o grupo. Verifique se tenho permissões de administrador.",
        );
        return;
      }

      await message.reply(
        `⏸️ *Grupo pausado por ${minutes} minuto(s)*\n\nApenas administradores podem enviar mensagens durante este período.`,
      );

      this.pauseService.pause(groupId, minutes);
    } catch (error) {
      console.error("Erro ao pausar grupo:", error);
      await message.reply("❌ Erro interno ao pausar o grupo.");
    }
  }
}
