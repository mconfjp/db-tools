# これはなに
スロークエリログをAWS CloudWatchから取得するツールです。
ローカルにpt-query-digestがあれば、それを利用していい感じにサマリのファイルを作成できます。

# 使い方
## 初期設定
- リポジトリをローカルに落としてくる
- .env.sampleをコピーして.envを作る
- `yarn install`
- `yarn tsc`

## 使い方
- .envの編集
    - ロググループ名を対象のスロークエリログに変更
    - AWSのアクセスキーを設定
    - 取得したい時間帯の指定
- `yarn node index.js`
- `pt-query-digest`の実行
    - `pt-query-digest ./slowquery-log/raw-20240902.log > digest/slow-summary.log`

