function report(line: number, where: string, message: string) {
  console.log(`${line}:${where}: ${message}`);
}

function error(line: number, message: string) {
  report(line, "", message);
}

export { error };
