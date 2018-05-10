'use strict'

const app = require('electron').app
const path = require('path')
const fs = require('fs-extra')
const machineIdSync = require('node-machine-id').machineIdSync;


/**
 * 获取当前app路径
 */
exports.getAppPath = function getAppPath() {
    let path = app.getAppPath();
    return path;
}

/**
 * 获取用户安装配置文件目录
 */
exports.getConfigPath = function getConfigPath() {
    let path = app.getPath('userData');
    return path;
}

/**
 * 获取日志目录
 */
exports.getLogPath = function getLogPath() {
    let path = app.getPath('logs');
    return path;
}


/**
 * 格式化时间
 */
exports.formatDate = function formatDate(date, fmt) {
    if (!fmt) fmt = 'yyyy-MM-dd';
    var o = {
        "M+": date.getMonth() + 1, //月份 
        "d+": date.getDate(), //日 
        "h+": date.getHours(), //小时 
        "m+": date.getMinutes(), //分 
        "s+": date.getSeconds(), //秒 
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度 
        "S": date.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
}

/**
 * 获取机器码
 */
exports.getMacId = function () {
    return machineIdSync();
}