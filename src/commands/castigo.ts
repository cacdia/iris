import type { Contact, GroupChat, Message } from "npm:whatsapp-web.js";
import type { ICommand, IWhatsAppService } from "../core/types.ts";
import { PermissionLevel } from "../core/types.ts";

// Use os tipos do pacote whatsapp-web.js para garantir compatibilidade
type AddParticipantsResultFromLib = {
  code: number;
  message: string;
  isInviteV4Sent: boolean;
};
type AddParticipantsResponseFromLib = { [participantId: string]: AddParticipantsResultFromLib } | string;
type RemoveParticipantsResponse = { status: number };

export class CastigoCommand implements ICommand {
  name = "castigo";
  description = "Remove um participante do grupo por N minutos (ex: !castigo @user 5)";
  requiredPermission = PermissionLevel.OWNER;

  private castigoTimers = new Map<string, number>();

  constructor(private whatsappService: IWhatsAppService) {}

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

    if (!message.mentionedIds || message.mentionedIds.length === 0) {
      await message.reply(
        "❌ Use: !castigo @usuario <minutos>\nExemplo: !castigo @joão 5"
      );
      return;
    }

    const targetUserId = message.mentionedIds[0];
    const minutes = parseInt(args[args.length - 1]);

    if (isNaN(minutes) || minutes <= 0 || minutes > 1440) {
      await message.reply(
        "❌ Use: !castigo @usuario <minutos>\nExemplo: !castigo @joão 5\n(Máximo: 1440 minutos)"
      );
      return;
    }

    const castigoKey = `${groupChat.id._serialized}:${targetUserId}`;
    if (this.castigoTimers.has(castigoKey)) {
      await message.reply("❌ Este usuário já está em castigo!");
      return;
    }

    try {
      const targetContact = await this.whatsappService.getClient().getContactById(targetUserId) as Contact;
      const targetName = targetContact.pushname || targetContact.name || targetContact.number || "Usuário";

      const participant = groupChat.participants.find(p => p.id._serialized === targetUserId);
      if (!participant) {
        await message.reply("❌ Este usuário não está no grupo!");
        return;
      }

      const removeResult = await groupChat.removeParticipants([targetUserId]) as RemoveParticipantsResponse;

      if (removeResult.status !== 200) {
        await message.reply("❌ Não foi possível remover o participante. Verifique se tenho permissões de administrador.");
        return;
      }

      await message.reply(
        `⏰ *${targetName}* foi colocado em castigo por ${minutes} minuto(s)!\n\n` +
        `O usuário será adicionado de volta ao grupo automaticamente.`
      );

      const timer = setTimeout(async () => {
        try {
          const addResult = await groupChat.addParticipants([targetUserId]) as AddParticipantsResponseFromLib;

          if (typeof addResult === "string") {
            // Caso de erro retornado como string
            await groupChat.sendMessage(
              `⚠️ Não foi possível adicionar *${targetName}* de volta ao grupo: ${addResult}`
            );
          } else if (
            typeof addResult === "object" &&
            addResult !== null &&
            Object.prototype.hasOwnProperty.call(addResult, targetUserId)
          ) {
            const userResult = addResult[targetUserId];
            if (
              typeof userResult === "object" &&
              userResult !== null &&
              typeof userResult.code === "number"
            ) {
              if (userResult.code === 200) {
                await groupChat.sendMessage(
                  `✅ *${targetName}* voltou ao grupo após cumprir o castigo!`
                );
              } else if (userResult.code === 403 && userResult.isInviteV4Sent) {
                await groupChat.sendMessage(
                  `📨 *${targetName}* recebeu um convite para retornar ao grupo após cumprir o castigo!`
                );
              } else {
                const errorMessage = userResult.message || "Erro desconhecido";
                await groupChat.sendMessage(
                  `⚠️ Não foi possível adicionar *${targetName}* automaticamente de volta ao grupo. Motivo: ${errorMessage}`
                );
              }
            } else {
              await groupChat.sendMessage(
                `⚠️ Não foi possível adicionar *${targetName}* de volta ao grupo (resultado inválido).`
              );
            }
          } else {
            await groupChat.sendMessage(
              `⚠️ Não foi possível adicionar *${targetName}* de volta ao grupo (formato de resposta inesperado).`
            );
          }
        } catch (error) {
          console.error("Erro ao adicionar usuário de volta após castigo:", error);
          await groupChat.sendMessage(
            `❌ Erro ao tentar adicionar *${targetName}* de volta ao grupo após o castigo.`
          );
        } finally {
          this.castigoTimers.delete(castigoKey);
        }
      }, minutes * 60 * 1000) as number;

      this.castigoTimers.set(castigoKey, timer);

    } catch (error) {
      console.error("Erro ao executar castigo:", error);
      await message.reply("❌ Erro interno ao executar o castigo.");
    }
  }

  cleanup(): void {
    this.castigoTimers.forEach((timer) => clearTimeout(timer));
    this.castigoTimers.clear();
  }
}
