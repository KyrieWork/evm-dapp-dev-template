import { format } from 'date-fns';

// 日志级别枚举
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// 日志配置接口
interface LogConfig {
  level: LogLevel;
  enableTimestamp: boolean;
  enableColor: boolean;
}

// 默认配置
const defaultConfig: LogConfig = {
  // 根据环境变量设置日志级别
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableTimestamp: true,
  enableColor: process.env.NODE_ENV !== 'production',
};

// ANSI 颜色代码
const Colors = {
  Reset: '\x1b[0m',
  Debug: '\x1b[36m', // 青色
  Info: '\x1b[32m', // 绿色
  Warn: '\x1b[33m', // 黄色
  Error: '\x1b[31m', // 红色
};

class Logger {
  private config: LogConfig;

  constructor(config: Partial<LogConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private serializeValue(value: any): string {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'bigint') return value.toString() + 'n';
    if (typeof value === 'symbol') return value.toString();
    if (value instanceof Error) {
      return `${value.name}: ${value.message}\n${value.stack || ''}`;
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(
          value,
          (_, v) => {
            if (typeof v === 'bigint') return v.toString() + 'n';
            if (v instanceof Error) {
              return {
                name: v.name,
                message: v.message,
                stack: v.stack,
              };
            }
            return v;
          },
          2
        );
      } catch (err) {
        return String(value);
      }
    }
    return String(value);
  }

  private formatMessage(level: string, message: any, ...args: any[]): string {
    const timestamp = this.config.enableTimestamp
      ? `[${format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS')}] `
      : '';
    const color = this.config.enableColor ? this.getLevelColor(level) : '';
    const resetColor = this.config.enableColor ? Colors.Reset : '';

    const formattedMessage = this.serializeValue(message);
    const formattedArgs = args.map(arg => this.serializeValue(arg)).join(' ');
    const finalMessage = formattedArgs ? `${formattedMessage} ${formattedArgs}` : formattedMessage;

    return `${timestamp}${color}[${level}] ${finalMessage}${resetColor}`;
  }

  private getLevelColor(level: string): string {
    switch (level) {
      case 'DEBUG':
        return Colors.Debug;
      case 'INFO':
        return Colors.Info;
      case 'WARN':
        return Colors.Warn;
      case 'ERROR':
        return Colors.Error;
      default:
        return Colors.Reset;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  debug(message: any, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage('DEBUG', message, ...args));
    }
  }

  info(message: any, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, ...args));
    }
  }

  warn(message: any, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, ...args));
    }
  }

  error(message: any, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message, ...args));
    }
  }

  // 更新日志配置
  setConfig(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// 创建默认日志实例
export const logger = new Logger();

// 导出便捷方法
export const logDebug = logger.debug.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);

// 导出类型和配置方法
export type { LogConfig };
export const setLogConfig = (config: Partial<LogConfig>) => logger.setConfig(config);
