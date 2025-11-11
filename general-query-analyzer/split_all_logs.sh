#!/bin/bash

# MySQL General Logファイルを10分割するスクリプト
# 使用方法: ./split_all_logs.sh

set -e  # エラーが発生したら停止

INPUT_DIR="input"
OUTPUT_DIR="mid-output"

echo "MySQL General Logファイルの一括分割処理を開始します..."
echo "入力ディレクトリ: $INPUT_DIR"
echo "出力ディレクトリ: $OUTPUT_DIR"
echo ""

# mid-outputディレクトリが存在しない場合は作成
if [ ! -d "$OUTPUT_DIR" ]; then
    echo "出力ディレクトリ '$OUTPUT_DIR' を作成します..."
    mkdir -p "$OUTPUT_DIR"
fi

# 処理対象ファイルをリストアップ（sample-general-query.logは除外）
FILES=$(find "$INPUT_DIR" -name "mysql-general.*.log" -type f | sort)

if [ -z "$FILES" ]; then
    echo "処理対象のファイルが見つかりません。"
    exit 1
fi

echo "処理対象ファイル一覧:"
echo "$FILES"
echo ""

TOTAL_FILES=$(echo "$FILES" | wc -l | tr -d ' ')
CURRENT=1

for file in $FILES; do
    echo "[$CURRENT/$TOTAL_FILES] 処理中: $file"
    
    # ファイル名から拡張子を取り除いてベース名を取得
    basename=$(basename "$file")
    
    # ファイルの行数を取得
    total_lines=$(wc -l < "$file")
    echo "  総行数: $total_lines"
    
    # 10分割するための1ファイルあたりの行数を計算
    lines_per_file=$((($total_lines + 9) / 10))  # 切り上げ計算
    echo "  1ファイルあたりの行数: $lines_per_file"
    
    # splitコマンドで分割
    split -l "$lines_per_file" "$file" "$OUTPUT_DIR/${basename}.part_"
    
    # 分割されたファイル数を確認
    split_count=$(ls "$OUTPUT_DIR/${basename}.part_"* 2>/dev/null | wc -l | tr -d ' ')
    echo "  分割ファイル数: $split_count"
    echo ""
    
    CURRENT=$((CURRENT + 1))
done

echo "全ての処理が完了しました！"
echo ""
echo "結果の確認:"
ls -la "$OUTPUT_DIR"