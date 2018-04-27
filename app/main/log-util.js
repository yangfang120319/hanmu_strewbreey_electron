'use strict'
/**
 * 日志
 */
const path = require('path')
const util = require('./util')
const fs = require('fs-extra')

const logPath = util.getLogPath();

//日志目录
const logDir = logPath + path.sep;

//日志级别
const level = {
    info: 'INFO ',
    debug: 'DEBUG',
    warn: 'WARN ',
    error: 'ERROR'
}

/**
 * 获取日志文件的名字，默认按天
 */
function getLogFileName() {
    let date = util.formatDate(new Date());
    return `${logDir}${date}.log`;
}

/**
 * 日志保存
 */
function save(data, level) {
    let time = util.formatDate(new Date(), 'yyyy-MM-dd hh:mm:ss');
    data = `${time} ${level} --- : ${data}\n`;
    fs.appendFile(getLogFileName(), data, (err) => {
        if (err) throw err;
        console.log('日志保存出错！');
    });
}

/**
 * 信息级别
 * @param {*} data 
 */
exports.info = function info(data) {
    save(data, level.info);
}
/**
 * debug级别
 * @param {*} data 
 */
exports.debug = function debug(data) {
    save(data, level.debug);
}
/**
 * 警告级别
 * @param {*} data 
 */

exports.warn = function warn(data) {
    save(data, level.wran);
}
/**
 * 错误级别
 * @param {*} data 
 */
exports.error = function error(data) {
    save(data, level.error);
}