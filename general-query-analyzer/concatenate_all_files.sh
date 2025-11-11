#!/bin/bash

# mid-output-2内の全ファイルをファイル名順で連結するスクリプト
# 使用方法: ./concatenate_all_files.sh

set -e  # エラーが発生したら停止

INPUT_DIR="mid-output-2"
OUTPUT_FILE="output/all-extracted-queries.txt"

echo "ファイル連結処理を開始します..."
echo "入力ディレクトリ: $INPUT_DIR"
echo "出力ファイル: $OUTPUT_FILE"
echo ""

# outputディレクトリが存在しない場合は作成
if [ ! -d "output" ]; then
    echo "出力ディレクトリ 'output' を作成します..."
    mkdir -p "output"
fi

# 既存の出力ファイルがあれば削除
if [ -f "$OUTPUT_FILE" ]; then
    echo "既存の出力ファイルを削除します..."
    rm "$OUTPUT_FILE"
fi

# 処理対象ファイルをファイル名順でリストアップ
FILES=$(find "$INPUT_DIR" -name "*.part_*" -type f | sort)

if [ -z "$FILES" ]; then
    echo "処理対象のファイルが見つかりません。"
    exit 1
fi

TOTAL_FILES=$(echo "$FILES" | wc -l | tr -d ' ')
CURRENT=1
TOTAL_LINES=0

echo "総ファイル数: $TOTAL_FILES"
echo ""
echo "連結処理開始..."

for file in $FILES; do
    echo "[$CURRENT/$TOTAL_FILES] 連結中: $(basename "$file")"
    
    # ファイルの行数を取得
    lines=$(wc -l < "$file" | tr -d ' ')
    TOTAL_LINES=$((TOTAL_LINES + lines))
    
    # ファイルを連結
    cat "$file" >> "$OUTPUT_FILE"
    
    CURRENT=$((CURRENT + 1))
    
    # 進捗を定期的に表示
    if [ $((CURRENT % 20)) -eq 0 ]; then
        echo "  進捗: $CURRENT/$TOTAL_FILES ファイル処理完了"
    fi
done

echo ""
echo "=== 連結処理完了 ==="
echo "出力ファイル: $OUTPUT_FILE"
echo "総行数: $TOTAL_LINES"

# 出力ファイルの詳細を表示
if [ -f "$OUTPUT_FILE" ]; then
    filesize=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
    echo "ファイルサイズ: $filesize"
    echo ""
    echo "最初の5行:"
    head -5 "$OUTPUT_FILE"
    echo ""
    echo "最後の5行:"
    tail -5 "$OUTPUT_FILE"
else
    echo "❌ 出力ファイルが作成されませんでした"
    exit 1
fi

echo ""
echo "✅ 全ての処理が正常に完了しました！"