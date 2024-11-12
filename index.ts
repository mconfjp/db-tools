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
    const cloudWatchLogs = await getCloudWatch();

    const timePairs = await sliceTime(startTime, endTime);
    
    let logs: string[] = [];

    for (const timePair of timePairs) {
        const params = {
            logGroupName: process.env.LOG_GROUP_NAME,
            startTime: timePair.start.getTime(),
            endTime: timePair.end.getTime()
        };

        let nextToken: string | undefined;
        do {
            const response = await cloudWatchLogs.filterLogEvents({ ...params, nextToken }).promise();
            if (response.events) {
                logs = logs.concat(response.events.map((event: AWS.CloudWatchLogs.FilteredLogEvent) => event.message || ''));
            }
            nextToken = response.nextToken;
        } while (nextToken);
    }

    return logs;
}

async function getCloudWatch(): Promise<AWS.CloudWatchLogs> {
    AWS.config.update({ region: process.env.AWS_REGION });

    // クレデンシャル情報の設定
    AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN
    });
    return new AWS.CloudWatchLogs();
}

async function sliceTime(startTime: Date, endTime: Date): Promise<{ start: Date, end: Date }[]> 
{
    let timePairs: { start: Date, end: Date }[] = [];
    let currentStartTime = new Date(startTime.getTime());
    let currentEndTime = new Date(currentStartTime);
    currentEndTime.setHours(23, 59, 59, 999);

    while (currentStartTime < endTime) {
        if (currentEndTime > endTime) {
            currentEndTime = new Date(endTime.getTime());
        }
        timePairs.push({ start: new Date(currentStartTime.getTime()), end: new Date(currentEndTime.getTime()) });

        currentStartTime = new Date(currentEndTime.getTime() + 1);
        currentEndTime = new Date(currentStartTime);
        currentEndTime.setHours(23, 59, 59, 999);
    }

    return timePairs;
}

getLogsFromCloudWatch(startTime, endTime)
    .then(logs => {
        fs.writeFileSync(outputFile, logs.join('\n'));
        console.log('Logs written to file');
    })
    .catch(error => {
        console.error(error);
    });