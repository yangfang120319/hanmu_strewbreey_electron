/**
 * 系统配置的URL
 */
const debug=false;
const url = debug ?`http://127.0.0.1`:`http://114.55.249.156`;

const baseUrl = debug ? `${url}:8080`:`${url}:9090`;
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
exports.mainPageUrl = debug ? `${url}:8081/login`:`${url}/login`;
//领取客资URL

//上下线 
exports.websocketUrl =`ws://localhost:8030/ws`;