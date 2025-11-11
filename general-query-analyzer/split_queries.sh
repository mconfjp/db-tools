#!/bin/bash

# SQLクエリファイルを適切なサイズに分割するスクリプト
# 各クエリ（行）の境界を保持しながら分割

INPUT_FILE="/Users/hiroki.morita.a/work/db-tools/general-query-analyzer/output/all-extracted-queries-with-semicolons.txt"
OUTPUT_DIR="/Users/hiroki.morita.a/work/db-tools/general-query-analyzer/output/split-files"
TARGET_SIZE_MB=100
LINES_PER_CHUNK=60000  # 概算として100MBあたり60000行を目安に設定（実際のサイズをチェックしながら調整）

echo "開始時刻: $(date)"
echo "入力ファイル: $INPUT_FILE"
echo "出力ディレクトリ: $OUTPUT_DIR"
echo "目標ファイルサイズ: ${TARGET_SIZE_MB}MB"

# 出力ディレクトリの作成
mkdir -p "$OUTPUT_DIR"

# 入力ファイルの情報を表示
echo "入力ファイルサイズ: $(ls -lh "$INPUT_FILE" | awk '{print $5}')"
echo "入力ファイル行数: $(wc -l < "$INPUT_FILE")"

# 1行あたりの平均バイト数を計算
TOTAL_BYTES=$(stat -c%s "$INPUT_FILE" 2>/dev/null || stat -f%z "$INPUT_FILE")
TOTAL_LINES=$(wc -l < "$INPUT_FILE")
AVG_BYTES_PER_LINE=$((TOTAL_BYTES / TOTAL_LINES))
TARGET_LINES_PER_FILE=$((TARGET_SIZE_MB * 1024 * 1024 / AVG_BYTES_PER_LINE))

echo "1行あたりの平均バイト数: $AVG_BYTES_PER_LINE"
echo "100MBあたりの目標行数: $TARGET_LINES_PER_FILE"

# ファイルを分割
echo "ファイル分割を開始..."

current_line=1
file_counter=1
total_lines=$TOTAL_LINES

while [ $current_line -le $total_lines ]; do
    # 出力ファイル名を設定
    output_file="$OUTPUT_DIR/queries-part-$(printf "%03d" $file_counter).sql"
    
    # 次のチャンクの終了行を計算
    end_line=$((current_line + TARGET_LINES_PER_FILE - 1))
    if [ $end_line -gt $total_lines ]; then
        end_line=$total_lines
    fi
    
    # 実際の行数を計算
    lines_in_chunk=$((end_line - current_line + 1))
    
    echo "パート $file_counter: 行 $current_line - $end_line ($lines_in_chunk 行)"
    
    # sedを使用して指定範囲の行を抽出
    sed -n "${current_line},${end_line}p" "$INPUT_FILE" > "$output_file"
    
    # 作成されたファイルのサイズを確認
    file_size=$(ls -lh "$output_file" | awk '{print $5}')
    echo "  作成されたファイル: $output_file (サイズ: $file_size)"
    
    # 次のチャンクの開始行を設定
    current_line=$((end_line + 1))
    file_counter=$((file_counter + 1))
done

echo ""
echo "分割完了!"
echo "作成されたファイル数: $((file_counter - 1))"
echo ""

echo "作成されたファイルの一覧:"
ls -lh "$OUTPUT_DIR"

echo ""
echo "各ファイルの行数確認:"
for file in "$OUTPUT_DIR"/queries-part-*.sql; do
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file")
        size=$(ls -lh "$file" | awk '{print $5}')
        basename=$(basename "$file")
        echo "$basename: $lines 行, $size"
    fi
done

echo ""
echo "最初のファイルの先頭5行を確認:"
head -5 "$OUTPUT_DIR/queries-part-001.sql"

echo ""
echo "最後のファイルの末尾5行を確認:"
last_file=$(ls "$OUTPUT_DIR"/queries-part-*.sql | tail -1)
echo "ファイル: $(basename "$last_file")"
tail -5 "$last_file"

echo ""
echo "終了時刻: $(date)"