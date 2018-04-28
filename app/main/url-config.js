/**
 * 系统配置的URL
 */
const url =`http://114.55.249.156`;

const baseUrl = `${url}:9090`;
// const baseUrl = `${url}:9090`
exports.baseUrl = baseUrl;

exports.getCompanyListUrl = `${baseUrl}/app/client/login/get_company_list`;

exports.getVerifyCode = `${baseUrl}/app/client/login/verify_code`;

exports.needVerifyCode = `${baseUrl}/app/client/login/need_verity_code`;

exports.loginWithCompanyId = `${baseUrl}/app/client/login/login_with_company_id`;

exports.mainPageUrl = `${url}/login`;