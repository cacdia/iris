import type { IPauseService, IWhatsAppService } from "../core/types.ts";
import type { GroupChat } from "npm:whatsapp-web.js";

export class PauseService implements IPauseService {
  private timers = new Map<string, number>();

  constructor(private whatsappService: IWhatsAppService) {}

  pause(groupId: string, minutes: number): void {
    if (this.timers.has(groupId)) {
      throw new Error("Group is already paused");
    }

    const timer = setTimeout(async () => {
      try {
        const chat = await this.whatsappService.getClient().getChatById(
          groupId,
        ) as GroupChat;
        await chat.setMessagesAdminsOnly(false);
        await chat.sendMessage(
          "▶️ *Grupo despausado automaticamente*\n\nTodos os participantes podem enviar mensagens novamente.",
        );
        this.timers.delete(groupId);
      } catch (error) {
        console.error("Erro ao despausar grupo automaticamente:", error);
        this.timers.delete(groupId);
      }
    }, minutes * 60 * 1000) as number;

    this.timers.set(groupId, timer);
  }

  unpause(groupId: string): boolean {
    const timer = this.timers.get(groupId);
    if (!timer) {
      return false;
    }

    clearTimeout(timer);
    this.timers.delete(groupId);
    return true;
  }

  isPaused(groupId: string): boolean {
    return this.timers.has(groupId);
  }

  cleanup(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }
}
