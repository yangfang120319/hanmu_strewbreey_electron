/**
 * 系统配置的URL
 */
const debug = false;

const url = debug ? `http://127.0.0.1` : `http://114.55.249.156`;

const baseUrl = debug ? `${url}:8080` : `${url}:9090`;
//主界面URL
exports.mainPageUrl = `http://114.55.249.156/login`;
// const baseUrl = `${url}:9090`
exports.baseUrl = baseUrl;
//获取公司列表
exports.getCompanyListUrl = `${baseUrl}/login/get_company_list_by_phone`;
//获取验证码
exports.getVerifyCode = `${baseUrl}/login/verify_code`;
//是否需要验证码
exports.needVerifyCode = `${baseUrl}/login/need_verity_code`;
//根据公司ID登陆
exports.loginWithCompanyId = `${baseUrl}/login/login_by_phone`;
//领取客资URL
exports.receiveKZUrl = `${baseUrl}/app/receive`;
//拒接客资
exports.refuseKZUrl = `${baseUrl}/app/refuse`;
//websocket url
exports.websocketUrl = `ws://114.55.249.156:8030/ws`;
//websocket url
exports.exitUrl = `${baseUrl}/staff/logout`;
//客户端版本
exports.clientVersion = 1;
//钉钉机器人Url
exports.dingRobotUrl = `https://oapi.dingtalk.com/robot/send?access_token=2b45af6f1dd5c66f7662eaeb4dc7454ad6ee8d13005f5d2096fa4b107f488487`;