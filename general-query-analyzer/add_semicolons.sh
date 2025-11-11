#!/bin/bash

# 各クエリ行の末尾にセミコロンを追加するスクリプト
# 使用方法: ./add_semicolons.sh

INPUT_FILE="/Users/hiroki.morita.a/work/db-tools/general-query-analyzer/output/all-extracted-queries.txt"
OUTPUT_FILE="/Users/hiroki.morita.a/work/db-tools/general-query-analyzer/output/all-extracted-queries-with-semicolons.txt"

echo "開始時刻: $(date)"
echo "入力ファイル: $INPUT_FILE"
echo "出力ファイル: $OUTPUT_FILE"

# ファイルサイズと行数を表示
echo "入力ファイルサイズ: $(ls -lh "$INPUT_FILE" | awk '{print $5}')"
echo "入力ファイル行数: $(wc -l < "$INPUT_FILE")"

# 各行の末尾に; を追加
# sedを使用して効率的に処理
echo "処理中..."
sed 's/$/;/' "$INPUT_FILE" > "$OUTPUT_FILE"

# 結果を確認
if [ $? -eq 0 ]; then
    echo "処理完了!"
    echo "出力ファイルサイズ: $(ls -lh "$OUTPUT_FILE" | awk '{print $5}')"
    echo "出力ファイル行数: $(wc -l < "$OUTPUT_FILE")"
    
    echo ""
    echo "最初の5行の確認:"
    head -5 "$OUTPUT_FILE"
    
    echo ""
    echo "最後の5行の確認:"
    tail -5 "$OUTPUT_FILE"
    
else
    echo "エラーが発生しました"
    exit 1
fi

echo "終了時刻: $(date)"