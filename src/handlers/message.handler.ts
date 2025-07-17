import type { Message } from "npm:whatsapp-web.js";
import type {
  ICommandRegistry,
  IMessageHandler,
  IWhatsAppService,
} from "../core/types.ts";
import { PermissionLevel } from "../core/types.ts";

export class MessageHandler implements IMessageHandler {
  constructor(
    private commandRegistry: ICommandRegistry,
    private whatsappService: IWhatsAppService,
  ) {}

  async handle(message: Message): Promise<void> {
    if (message.fromMe || !message.body.startsWith("!")) return;

    const args = message.body.slice(1).split(/\s+/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const command = this.commandRegistry.get(commandName);
    if (!command) return;

    try {
      const userPermissionLevel = await this.whatsappService.getPermissionLevel(
        message,
      );

      if (userPermissionLevel < command.requiredPermission) {
        const permissionNames = {
          [PermissionLevel.EVERYONE]: "todos",
          [PermissionLevel.ADMIN]: "administradores",
          [PermissionLevel.OWNER]: "donos do grupo",
        };

        await message.reply(
          `❌ Comando '!${commandName}' é exclusivo para ${
            permissionNames[command.requiredPermission]
          }.`,
        );
        return;
      }

      await command.execute(message, args, this.whatsappService);
    } catch (error) {
      console.error("Erro ao executar comando:", error);
      await message.reply("❌ Erro interno do bot.");
    }
  }
}
