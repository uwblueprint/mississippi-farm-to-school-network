type LogFunction = (message: string, ...args: unknown[]) => void;

interface Logger {
  info: LogFunction;
  warn: LogFunction;
  error: LogFunction;
  debug: LogFunction;
}

const logger = (filename: string): Logger => {
  const formatMessage = (level: string, message: string): string => {
    const timestamp = new Date().toISOString();
    const file = filename.split('/').pop();
    return `[${timestamp}] [${level}] [${file}]: ${message}`;
  };

  return {
    info(message: string, ...args: unknown[]): void {
      console.info(formatMessage('INFO', message), ...args);
    },
    warn(message: string, ...args: unknown[]): void {
      console.warn(formatMessage('WARN', message), ...args);
    },
    error(message: string, ...args: unknown[]): void {
      console.error(formatMessage('ERROR', message), ...args);
    },
    debug(message: string, ...args: unknown[]): void {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(formatMessage('DEBUG', message), ...args);
      }
    },
  };
};

export default logger;
