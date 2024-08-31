# これはなに
スロークエリログをAWS CloudWatchから取得するツールです。
ローカルにpt-query-digestがあれば、それを利用していい感じにサマリのファイルを作成できます。

# 使い方
## 初期設定
- .envの編集
- yarn install
- yarn run tsc

## 使い方
- index.ts内の日付情報をいじって、取得したい日付を指定する
- コードの実行
    - yarn run index.js
- slowquery-logフォルダにスロークエリログのファイルが作成されていることを確認
- pt-query-digestで確認

