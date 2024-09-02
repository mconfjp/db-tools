"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
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
dotenv_1.default.config();
const startTime = new Date(process.env.START_TIME_STR);
const endTime = new Date(process.env.END_TIME_STR);
const outputFile = path.join(__dirname, `slowquery-log/raw-${process.env.START_TIME_STR}.log`);
function getLogsFromCloudWatch(startTime, endTime) {
    return __awaiter(this, void 0, void 0, function* () {
        aws_sdk_1.default.config.update({ region: process.env.AWS_REGION });
        // クレデンシャル情報の設定
        aws_sdk_1.default.config.update({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            sessionToken: process.env.AWS_SESSION_TOKEN
        });
        const cloudWatchLogs = new aws_sdk_1.default.CloudWatchLogs();
        const params = {
            logGroupName: process.env.LOG_GROUP_NAME,
            startTime: startTime.getTime(),
            endTime: endTime.getTime()
        };
        const response = yield cloudWatchLogs.filterLogEvents(params).promise();
        if (response.events) {
            return response.events.map(event => event.message || '');
        }
        else {
            return [];
        }
    });
}
getLogsFromCloudWatch(startTime, endTime)
    .then(logs => {
    fs.writeFileSync(outputFile, logs.join('\n'));
    console.log('Logs written to file');
})
    .catch(error => {
    console.error(error);
});
