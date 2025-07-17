import { IrisBot } from "./bot/iris.ts";

const bot = new IrisBot();
bot.start().catch(console.error);
