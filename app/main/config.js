'use strict'

const app = require('electron').app
const path = require('path')
const fs = require('fs-extra')
const util = require('./util')


let appPath = util.getAppPath();
//用户设置保存位置
const userSetPath = appPath + path.sep + 'config' + path.sep + 'user-set.json';

/**
 * 保存用户设置
 * 
 * @param {*} data 
 */
exports.saveUserSet = function saveUserSet(data) {
    fs.outputJsonSync(userSetPath, data)
}

/**
 * 获取用户设置
 */
exports.getUserSet = function getUserSet() {
    return fs.readJsonSync(userSetPath, {
        throws: false
    })
}