import whatsapp from "npm:whatsapp-web.js";
import type { Client as ClientType, Message } from "npm:whatsapp-web.js";
import qrcode from "npm:qrcode-terminal";
import { WhatsAppService } from "../services/whatsapp.service.ts";
import { PauseService } from "../services/pause.service.ts";
import { CommandRegistry } from "../services/command-registry.ts";
import { MessageHandler } from "../handlers/message.handler.ts";
import { createCommands } from "../commands/index.ts";
import { CastigoCommand } from "../commands/castigo.ts";

const { Client, LocalAuth } = whatsapp;

// IrisBot implementa Bot
export class IrisBot {
  private client: ClientType;
  private whatsappService: WhatsAppService;
  private pauseService: PauseService;
  private commandRegistry: CommandRegistry;
  private messageHandler: MessageHandler;
  private castigoCommand: CastigoCommand | undefined;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: "iris-bot",
        dataPath: "./auth_data",
      }),
      puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    });

    // Inicializar propriedades no construtor
    this.whatsappService = new WhatsAppService(this.client);
    this.pauseService = new PauseService(this.whatsappService);
    this.commandRegistry = new CommandRegistry();
    this.messageHandler = new MessageHandler(
      this.commandRegistry,
      this.whatsappService,
    );

    this.setupCommands();
    this.setupEvents();
  }

  private setupCommands(): void {
    const commands = createCommands(
      this.commandRegistry,
      this.pauseService,
      this.whatsappService,
    );

    commands.forEach((command) => {
      this.commandRegistry.register(command);
      // Guardar referência do comando castigo para cleanup
      if (command.name === "castigo") {
        this.castigoCommand = command as CastigoCommand;
      }
    });

    console.log(
      `📦 Carregados ${this.commandRegistry.getAll().length} comandos:`,
    );
    this.commandRegistry.getAll().forEach((command) => {
      console.log(`   • ${command.name}`);
    });
  }

  private setupEvents(): void {
    this.client.on("qr", (qr: string) => {
      console.log("📱 Escaneie o QR Code:");
      qrcode.generate(qr, { small: true });
    });

    this.client.on("authenticated", () => {
      console.log("✅ Autenticado com sucesso!");
    });

    this.client.on("auth_failure", (msg: string) => {
      console.error("❌ Falha na autenticação:", msg);
    });

    this.client.on("ready", () => {
      console.log("🤖 Iris Bot está pronto!");
    });

    this.client.on("message", async (message: Message) => {
      await this.messageHandler.handle(message);
    });

    this.client.on("disconnected", (reason: string) => {
      console.log("🔌 Desconectado:", reason);
      this.pauseService.cleanup();
      this.castigoCommand?.cleanup();
    });
  }

  async start(): Promise<void> {
    console.log("🔄 Inicializando Iris Bot...");
    await this.client.initialize();
  }
}
