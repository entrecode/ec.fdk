import { createInterface } from "node:readline";

export function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function promptPassword(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stderr.write(question);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf-8");
    let password = "";
    const onData = (ch: string) => {
      if (ch === "\u0003") {
        // Ctrl+C
        process.stderr.write("\n");
        process.exit(130);
      }
      if (ch === "\r" || ch === "\n") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stderr.write("\n");
        resolve(password);
        return;
      }
      if (ch === "\u007f" || ch === "\b") {
        // backspace
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stderr.write("\b \b");
        }
        return;
      }
      password += ch;
      process.stderr.write("*");
    };
    stdin.on("data", onData);
  });
}
