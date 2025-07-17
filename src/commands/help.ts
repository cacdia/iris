import type { Message } from "npm:whatsapp-web.js";
import type {
  ICommand,
  ICommandRegistry,
  IWhatsAppService,
} from "../core/types.ts";
import { PermissionLevel } from "../core/types.ts";

export class HelpCommand implements ICommand {
  name = "help";
  description = "Lista todos os comandos";
  requiredPermission = PermissionLevel.EVERYONE;

  constructor(private commandRegistry: ICommandRegistry) {}

  async execute(
    message: Message,
    _args: string[],
    whatsappService: IWhatsAppService,
  ): Promise<void> {
    const chat = await message.getChat();
    const userPermissionLevel = await whatsappService.getPermissionLevel(
      message,
    );

    let helpText = "📋 *Comandos Disponíveis:*\n\n";

    for (const command of this.commandRegistry.getAll()) {
      // Só mostra comandos que o usuário pode executar
      if (userPermissionLevel < command.requiredPermission && chat.isGroup) {
        continue;
      }

      const permissionIcon =
        command.requiredPermission === PermissionLevel.OWNER
          ? "👑 "
          : command.requiredPermission === PermissionLevel.ADMIN
          ? "⭐ "
          : "";

      helpText +=
        `• ${permissionIcon}!${command.name} - ${command.description}\n`;
    }

    if (chat.isGroup) {
      helpText += "\n👑 = Apenas donos | ⭐ = Administradores e donos";
    }

    await message.reply(helpText);
  }
}
