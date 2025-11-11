#!/bin/bash

# MySQL General Logファイルからクエリを抽出するバッチ処理スクリプト
# 使用方法: ./extract_queries_batch.sh

set -e  # エラーが発生したら停止

INPUT_DIR="mid-output"
OUTPUT_DIR="mid-output-2"

echo "MySQL General Logファイルからのクエリ抽出バッチ処理を開始します..."
echo "入力ディレクトリ: $INPUT_DIR"
echo "出力ディレクトリ: $OUTPUT_DIR"
echo ""

# mid-output-2ディレクトリが存在しない場合は作成
if [ ! -d "$OUTPUT_DIR" ]; then
    echo "出力ディレクトリ '$OUTPUT_DIR' を作成します..."
    mkdir -p "$OUTPUT_DIR"
fi

# 処理対象ファイルをリストアップ（.part_で終わるファイル）
FILES=$(find "$INPUT_DIR" -name "*.part_*" -type f | sort)

if [ -z "$FILES" ]; then
    echo "処理対象のファイルが見つかりません。"
    exit 1
fi

echo "処理対象ファイル一覧:"
echo "$FILES" | head -10
if [ $(echo "$FILES" | wc -l) -gt 10 ]; then
    echo "... および他 $(($(echo "$FILES" | wc -l) - 10)) ファイル"
fi
echo ""

TOTAL_FILES=$(echo "$FILES" | wc -l | tr -d ' ')
CURRENT=1
SUCCESS_COUNT=0
ERROR_COUNT=0

echo "総ファイル数: $TOTAL_FILES"
echo ""

for file in $FILES; do
    echo "[$CURRENT/$TOTAL_FILES] 処理中: $file"
    
    # ファイル名から拡張子を取り除いてベース名を取得
    basename=$(basename "$file")
    output_file="$OUTPUT_DIR/$basename"
    
    # general-query-extractor.tsを実行
    if npx ts-node general-query-extractor.ts "$file" \
        --include-commands "Execute" \
        --exclude-schemas "performance_schema,information_schema" \
        --output "$output_file" 2>/dev/null; then
        
        # 出力ファイルのサイズを確認
        if [ -f "$output_file" ]; then
            filesize=$(wc -c < "$output_file" | tr -d ' ')
            lines=$(wc -l < "$output_file" | tr -d ' ')
            echo "  ✅ 成功: $lines 行, $filesize バイト"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            echo "  ⚠️  出力ファイルが作成されませんでした"
            ERROR_COUNT=$((ERROR_COUNT + 1))
        fi
    else
        echo "  ❌ エラー: 処理に失敗しました"
        ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
    
    CURRENT=$((CURRENT + 1))
    
    # 進捗を定期的に表示
    if [ $((CURRENT % 10)) -eq 0 ]; then
        echo ""
        echo "=== 進捗レポート [$CURRENT/$TOTAL_FILES] ==="
        echo "成功: $SUCCESS_COUNT ファイル"
        echo "エラー: $ERROR_COUNT ファイル"
        echo ""
    fi
done

echo ""
echo "=== 最終結果 ==="
echo "処理完了！"
echo "成功: $SUCCESS_COUNT ファイル"
echo "エラー: $ERROR_COUNT ファイル"
echo "総処理ファイル数: $TOTAL_FILES"
echo ""
echo "出力ディレクトリの確認:"
ls -la "$OUTPUT_DIR" | head -5
if [ $(ls -1 "$OUTPUT_DIR" | wc -l) -gt 5 ]; then
    echo "... および他 $(($(ls -1 "$OUTPUT_DIR" | wc -l) - 5)) ファイル"
fi