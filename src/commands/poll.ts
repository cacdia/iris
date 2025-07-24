import type { Message } from "npm:whatsapp-web.js";
import { Poll } from "npm:whatsapp-web.js";
import type { ICommand, IWhatsAppService } from "../core/types.ts";
import { PermissionLevel } from "../core/types.ts";

/**
 * Comando para criar enquetes no grupo.
 * Uso: !poll <pergunta> | <opção 1> | <opção 2> [| <opção 3> ...] [--multi]
 * Exemplo: !poll Qual seu time? | Flamengo | Vasco | Fluminense --multi
 */
export class PollCommand implements ICommand {
    name = "poll";
    description =
        "Cria uma enquete no grupo. Ex: !poll Qual sua cor favorita? | Azul | Verde | Vermelho";
    requiredPermission = PermissionLevel.ADMIN;

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

        const fullText = args.join(" ");
        // Separar por pipe (|), remover espaços extras
        const parts = fullText.split("|").map((s) => s.trim()).filter(Boolean);

        if (parts.length < 3) {
            await message.reply(
                "❌ Use: !poll <pergunta> | <opção 1> | <opção 2> [| <opção 3> ...] [--multi]\nExemplo: !poll Qual seu time? | Flamengo | Vasco | Fluminense",
            );
            return;
        }

        // Detectar se é múltipla escolha
        const lastArg = parts[parts.length - 1];
        const allowMultipleAnswers = lastArg.toLowerCase() === "--multi";
        const pollOptions = allowMultipleAnswers
            ? parts.slice(1, -1)
            : parts.slice(1);

        if (pollOptions.length < 2 || pollOptions.length > 12) {
            await message.reply(
                "❌ Uma enquete deve ter entre 2 e 12 opções.",
            );
            return;
        }

        const pollName = parts[0];

        // Gera um messageSecret aleatório de 32 números (requisito da API)
        const messageSecret = Array.from({ length: 32 }, () =>
            Math.floor(Math.random() * 256)
        );

        try {
            const poll = new Poll(
                pollName,
                pollOptions,
                { allowMultipleAnswers, messageSecret },
            );

            await chat.sendMessage(poll);
        } catch (error) {
            console.error("Erro ao criar enquete:", error);
            await message.reply("❌ Erro ao criar a enquete.");
        }
    }
}
