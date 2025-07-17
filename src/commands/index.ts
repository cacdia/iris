import type {
  ICommand,
  ICommandRegistry,
  IWhatsAppService,
} from "../core/types.ts";
import type { PauseService } from "../services/pause.service.ts";

// Importar apenas os comandos da nova arquitetura
import { HelpCommand } from "./help.ts";
import { PauseCommand } from "./pause.ts";
import { UnpauseCommand } from "./unpause.ts";
import { GroupInfoCommand } from "./groupinfo.ts";
import { CastigoCommand } from "./castigo.ts";

/**
 * Fábrica de comandos - cria instâncias dos comandos
 */
export function createCommands(
  commandRegistry: ICommandRegistry,
  pauseService: PauseService,
  whatsappService: IWhatsAppService,
): ICommand[] {
  return [
    new HelpCommand(commandRegistry),
    new PauseCommand(pauseService),
    new UnpauseCommand(pauseService),
    new GroupInfoCommand(whatsappService),
    new CastigoCommand(whatsappService),
  ];
}
