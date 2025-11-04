# MySQL General Query Log Analyzer

MySQLの一般クエリログからクエリを抽出・分析するCLIツールです。

## 概要

このツールは、MySQLの一般クエリログ（general query log）を解析し、以下の機能を提供します：

- 実際に実行されたクエリの一覧を抽出
- 特定のコマンドタイプでフィルタリング（Query、Execute、Connect、Quitなど）
- 特定のスキーマを除外（performance_schema、information_schemaなど）
- 複数の出力形式に対応（raw、formatted、JSON）

## フォルダ構成

```
general-query-analyzer/
├── general-query-extractor.ts    # メインのCLIツール
├── samples/                      # サンプルファイル
│   └── sample-general-query.log  # テスト用サンプルログ
├── output/                       # 出力ファイル用フォルダ
└── README.md                     # このファイル
```

## 使用方法

### 基本的な使用方法

```bash
# カレントディレクトリをgeneral-query-analyzerに移動
cd general-query-analyzer

# 基本的なクエリ抽出（全てのクエリをraw形式で出力）
npx ts-node general-query-extractor.ts <<input_file>>

# ヘルプを表示
npx ts-node general-query-extractor.ts --help
```

### オプション一覧

| オプション | 説明 | 例 |
|-----------|------|---|
| `--include-commands` | 含めるコマンドタイプ（カンマ区切り） | `--include-commands "Query,Execute"` |
| `--exclude-commands` | 除外するコマンドタイプ（カンマ区切り） | `--exclude-commands "Connect,Quit,Prepare"` |
| `--exclude-schemas` | 除外するスキーマ（カンマ区切り） | `--exclude-schemas "performance_schema,information_schema"` |
| `--format` | 出力形式 (`raw`, `formatted`, `json`) | `--format json` |
| `--output` | 出力ファイル | `--output output/result.txt` |
| `--help` | ヘルプを表示 | |

### 実用的な例

#### 1. アプリケーションクエリのみを抽出

```bash
# performance_schemaとinformation_schemaを除外し、Queryコマンドのみを抽出
npx ts-node general-query-extractor.ts samples/mysql-general.log.2025-10-31.00 \
  --include-commands "Execute" \
  --exclude-schemas "performance_schema,information_schema" \
  --output output/app-queries.txt
```

#### 2. 全体の概要をJSON形式で確認

```bash
# 全てのクエリをJSON形式で出力して詳細を確認
npx ts-node general-query-extractor.ts samples/sample-general-query.log \
  --format json \
  --output output/all-queries.json
```

#### 3. 接続・切断ログを除外して分析

```bash
# Connect、Quit、Prepareを除外してフォーマット済み形式で出力
npx ts-node general-query-extractor.ts samples/sample-general-query.log \
  --exclude-commands "Connect,Quit,Prepare" \
  --format formatted \
  --output output/main-queries.txt
```

## 出力形式

### 1. raw形式（デフォルト）
クエリ文のみを1行ずつ出力

```
SET @@sql_log_bin=on
set local oscar_local_only_replica_host_status=1;
SELECT durable_lsn, current_read_point, server_id FROM information_schema.replica_host_status;
```

### 2. formatted形式
タイムスタンプ、接続ID、コマンド情報も含めて出力

```
[2025-10-30T23:00:01.040677Z] ID:4415095 CMD:Query
SET @@sql_log_bin=on

[2025-10-30T23:00:01.272110Z] ID:4415068 CMD:Query
set local oscar_local_only_replica_host_status=1;
```

### 3. json形式
プログラムで処理しやすいJSON形式

```json
[
  {
    "timestamp": "2025-10-30T23:00:01.040677Z",
    "connectionId": "4415095",
    "command": "Query",
    "query": "SET @@sql_log_bin=on"
  }
]
```

## 対応するログ形式

MySQLの一般クエリログの標準形式に対応しています：

```
Time                 Id Command    Argument
2025-10-30T23:00:01.040677Z	4415095 Query	SET @@sql_log_bin=on
```

## 要件

- Node.js
- TypeScript
- 既存プロジェクトのts-node設定

## 注意事項

- 一般クエリログは大きなファイルになることがあります。必要に応じてフィルタリングオプションを使用してください。
- ツールはメモリ上でファイル全体を読み込むため、非常に大きなファイルの場合は注意が必要です。
- タイムスタンプはISO 8601形式（`YYYY-MM-DDTHH:mm:ss.sssZ`）を想定しています。

## 今後の拡張予定

- 時間範囲指定機能
- クエリパターンマッチング
- 実行時間による絞り込み
- 統計機能（クエリ種別の集計など）
- パフォーマンス指標の抽出