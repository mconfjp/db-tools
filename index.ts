import AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

/**
 * 作業の流れ
 * 1. 設定値を変更
 *  取得したいロググループ、日付、AWSのクレデンシャルを更新
 * 2. コードを実行
 *  yarn tsc
 *  yarn node get-slowquery-log-from-cloudwatch.js
 * 3. pt-query-digestで解析
 * pt-query-digest slowquery-log/filename > digest/slow-summary.log
 */

/**
 * 各種設定
 */
dotenv.config();

// 整形
const startTime = new Date(process.env.START_TIME_STR as string);
const endTime = new Date(process.env.END_TIME_STR as string);
const outputFile = path.join(__dirname, `slowquery-log/raw-${process.env.START_TIME_STR as string}.log`);

async function getLogsFromCloudWatch(startTime: Date, endTime: Date): Promise<string[]> 
{
    AWS.config.update({ region: process.env.AWS_REGION });

    // クレデンシャル情報の設定
    AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN
    });
    const cloudWatchLogs = new AWS.CloudWatchLogs();

    const params = {
        logGroupName: process.env.LOG_GROUP_NAME,
        startTime: startTime.getTime(),
        endTime: endTime.getTime()
    };

    
    let logs: string[] = [];
    let nextToken: string | undefined;

    do {
        const response = await cloudWatchLogs.filterLogEvents({ ...params, nextToken }).promise();
        if (response.events) {
            logs = logs.concat(response.events.map(event => event.message || ''));
        }
        nextToken = response.nextToken;
    } while (nextToken);

    return logs;
}

getLogsFromCloudWatch(startTime, endTime)
    .then(logs => {
        fs.writeFileSync(outputFile, logs.join('\n'));
        console.log('Logs written to file');
    })
    .catch(error => {
        console.error(error);
    });