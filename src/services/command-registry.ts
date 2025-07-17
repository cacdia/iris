import type { ICommand, ICommandRegistry } from "../core/types.ts";

export class CommandRegistry implements ICommandRegistry {
  private commands = new Map<string, ICommand>();

  register(command: ICommand): void {
    this.commands.set(command.name, command);
  }

  get(name: string): ICommand | undefined {
    return this.commands.get(name);
  }

  getAll(): readonly ICommand[] {
    return Object.freeze([...this.commands.values()]);
  }
}
