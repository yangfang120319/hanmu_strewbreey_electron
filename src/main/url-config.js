/**
 * 系统配置的URL
 */
const debug = false;
const url = debug ? `http://127.0.0.1` : `http://114.55.249.156`;

const baseUrl = debug ? `${url}:8080` : `${url}:9090`;
// const baseUrl = `${url}:9090`
exports.baseUrl = baseUrl;
//获取公司列表
exports.getCompanyListUrl = `${baseUrl}/staff/get_company_list`;
//获取验证码
exports.getVerifyCode = `${baseUrl}/staff/verify_code`;
//是否需要验证码
exports.needVerifyCode = `${baseUrl}/staff/need_verity_code`;
//根据公司ID登陆
exports.loginWithCompanyId = `${baseUrl}/staff/login_with_company_id`;
//主界面URL
exports.mainPageUrl = `${url}/login`;
//领取客资URL
exports.receiveKZUrl = `${baseUrl}/app/receive`;
//拒接客资
exports.refuseKZUrl = `${baseUrl}/app/refuse`;
//websocket url
exports.websocketUrl = `ws://114.55.249.156:8030/ws`;