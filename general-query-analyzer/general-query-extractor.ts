#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

/**
 * MySQLの一般クエリログからクエリを抽出するツール
 * 
 * 一般クエリログの形式:
 * Time                 Id Command    Argument
 * 2025-10-30T23:00:01.040677Z	4415095 Query	SET @@sql_log_bin=on
 */

interface ParsedQuery {
  timestamp: string;
  connectionId: string;
  command: string;
  query: string;
}

interface ExtractionOptions {
  excludeCommands?: string[];
  excludeSchemas?: string[];
  includeCommands?: string[];
  outputFormat?: 'raw' | 'formatted' | 'json';
}

class GeneralQueryExtractor {
  private options: ExtractionOptions;

  constructor(options: ExtractionOptions = {}) {
    this.options = {
      excludeCommands: options.excludeCommands || [],
      excludeSchemas: options.excludeSchemas || [],
      includeCommands: options.includeCommands || [],
      outputFormat: options.outputFormat || 'raw'
    };
  }

  /**
   * 一般クエリログファイルを解析してクエリを抽出
   */
  extractQueries(logFilePath: string): ParsedQuery[] {
    const content = fs.readFileSync(logFilePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    const queries: ParsedQuery[] = [];
    
    for (const line of lines) {
      // ヘッダー行をスキップ（Time, Id, Command, Argument など）
      if (line.startsWith('Time') || line.startsWith('/rdsdbbin') || line.startsWith('Tcp port:')) {
        continue;
      }
      
      const parsed = this.parseLine(line);
      if (parsed && this.shouldIncludeQuery(parsed)) {
        queries.push(parsed);
      }
    }
    
    return queries;
  }

  /**
   * ログ行を解析してクエリ情報を抽出
   */
  private parseLine(line: string): ParsedQuery | null {
    // 一般クエリログの実際の形式: timestamp\tid command\tquery
    // 例: 2025-10-30T23:00:01.040677Z\t4415095 Query\tSET @@sql_log_bin=on
    const parts = line.split('\t');
    
    if (parts.length < 3) {
      return null;
    }
    
    const timestamp = parts[0].trim();
    const idAndCommand = parts[1].trim();
    const query = parts.slice(2).join('\t').trim();
    
    // IDとCommandを分離（スペースで区切られている）
    const idCommandParts = idAndCommand.split(/\s+/);
    if (idCommandParts.length < 2) {
      return null;
    }
    
    const connectionId = idCommandParts[0];
    const command = idCommandParts.slice(1).join(' ');
    
    // タイムスタンプの形式チェック（簡易的）
    // MySQLの一般クエリログのタイムスタンプは ISO 8601 形式
    if (!timestamp.includes('T') || !timestamp.includes('Z')) {
      return null;
    }
    
    // 接続IDが数値かチェック
    if (!/^\d+$/.test(connectionId)) {
      return null;
    }
    
    return {
      timestamp,
      connectionId,
      command,
      query
    };
  }

  /**
   * クエリを含めるかどうかの判定
   */
  private shouldIncludeQuery(parsed: ParsedQuery): boolean {
    // コマンドタイプのフィルタリング
    if (this.options.includeCommands && this.options.includeCommands.length > 0) {
      if (!this.options.includeCommands.includes(parsed.command)) {
        return false;
      }
    }
    
    if (this.options.excludeCommands && this.options.excludeCommands.includes(parsed.command)) {
      return false;
    }
    
    // スキーマのフィルタリング
    if (this.options.excludeSchemas && this.options.excludeSchemas.length > 0) {
      for (const schema of this.options.excludeSchemas) {
        if (parsed.query.toLowerCase().includes(schema.toLowerCase())) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * 結果を指定された形式で出力
   */
  formatOutput(queries: ParsedQuery[]): string {
    switch (this.options.outputFormat) {
      case 'json':
        return JSON.stringify(queries, null, 2);
      
      case 'formatted':
        return queries.map(q => 
          `[${q.timestamp}] ID:${q.connectionId} CMD:${q.command}\n${q.query}\n`
        ).join('\n');
      
      case 'raw':
      default:
        return queries.map(q => q.query).join('\n');
    }
  }
}

/**
 * CLI用のヘルプメッセージ
 */
function showHelp(): void {
  console.log(`
MySQL General Query Log Extractor

使用方法:
  npx ts-node general-query-extractor.ts <logfile> [options]

オプション:
  --exclude-commands <commands>    除外するコマンド（カンマ区切り）
                                  例: --exclude-commands "Connect,Quit,Prepare"
  
  --exclude-schemas <schemas>      除外するスキーマ（カンマ区切り）
                                  例: --exclude-schemas "performance_schema,information_schema"
  
  --include-commands <commands>    含めるコマンドのみ（カンマ区切り）
                                  例: --include-commands "Query,Execute"
  
  --format <format>               出力形式: raw, formatted, json (デフォルト: raw)
  
  --output <file>                 出力ファイル（指定しない場合は標準出力）
  
  --help                          このヘルプを表示

例:
  # 基本的な使用
  npx ts-node general-query-extractor.ts samples/sample.log
  
  # Queryコマンドのみを抽出
  npx ts-node general-query-extractor.ts samples/sample.log --include-commands "Query"
  
  # performance_schemaを除外
  npx ts-node general-query-extractor.ts samples/sample.log --exclude-schemas "performance_schema"
  
  # フォーマット済みでファイルに出力
  npx ts-node general-query-extractor.ts samples/sample.log --format formatted --output output/result.txt
`);
}

/**
 * コマンドライン引数を解析
 */
function parseArgs(args: string[]): { logFile?: string; options: ExtractionOptions; outputFile?: string } {
  const options: ExtractionOptions = {};
  let logFile: string | undefined;
  let outputFile: string | undefined;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--help':
        showHelp();
        process.exit(0);
        break;
      
      case '--exclude-commands':
        options.excludeCommands = args[++i]?.split(',').map(s => s.trim());
        break;
      
      case '--exclude-schemas':
        options.excludeSchemas = args[++i]?.split(',').map(s => s.trim());
        break;
      
      case '--include-commands':
        options.includeCommands = args[++i]?.split(',').map(s => s.trim());
        break;
      
      case '--format':
        options.outputFormat = args[++i] as 'raw' | 'formatted' | 'json';
        break;
      
      case '--output':
        outputFile = args[++i];
        break;
      
      default:
        if (!arg.startsWith('--') && !logFile) {
          logFile = arg;
        }
        break;
    }
  }
  
  return { logFile, options, outputFile };
}

/**
 * メイン処理
 */
function main(): void {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    showHelp();
    return;
  }
  
  const { logFile, options, outputFile } = parseArgs(args);
  
  if (!logFile) {
    console.error('エラー: ログファイルが指定されていません');
    showHelp();
    process.exit(1);
  }
  
  if (!fs.existsSync(logFile)) {
    console.error(`エラー: ファイルが見つかりません: ${logFile}`);
    process.exit(1);
  }
  
  try {
    const extractor = new GeneralQueryExtractor(options);
    const queries = extractor.extractQueries(logFile);
    const output = extractor.formatOutput(queries);
    
    if (outputFile) {
      fs.writeFileSync(outputFile, output);
      console.log(`${queries.length}件のクエリを ${outputFile} に出力しました`);
    } else {
      console.log(output);
    }
    
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

// CLIとして実行された場合
if (require.main === module) {
  main();
}

export { GeneralQueryExtractor, ParsedQuery, ExtractionOptions };