const {
	app,
	Menu,
	Tray,
	dialog,
	BrowserWindow,
	ipcMain,
	session,
	Notification
} = require('electron')
//debug模式
const debugModel = true;
const electron = require('electron')
const axios = require('axios')
//判断日志模式
let log;
if (debugModel) {
	log = console;
} else {
	log = require('./src/main/log-util')
}

const config = require('./src/main/config')
const path = require('path')
const url = require('url')
const urlConfig = require('./src/main/url-config')



//页面地址
const LOGIN_WINDOW_URL = 'src/view/login.html';
const MAIN_WINDOW_URL = urlConfig.mainPageUrl;
const MSG_ALERT_WINDOW = 'src/view/alert.html';
const WEBSOCKET_WINDOW = 'src/view/websocket.html';
const TRAY_ICON = 'src/static/icons/icon.ico';
//透明的图标
const TRAY_ICON_TRAN = 'src/static/icons/icont.ico';
const SUCCESS_IMG = `src/static/img/success.png`;
const DIALOG_WINDOW = `src/view/dialog.html`;
//创建的所有窗口及图标
let tray = null
let loginWindow = null;
let mainWindow = null;
let msgAlertWindow = null;
let websocketWindow = null;
let dialogWindow = null;
//获取窗口大小
let displayHeight;
let displayWidth;

/**
 * 所有全局共享的变量
 */
let commonVar = {
	//当前收到的客资信息
	nowReceiveInfo: '',
	//公司信息
	companyInfo: '',
	//用户信息
	userInfo: '',
	//当前登录信息
	nowLoginInfo: '',
	//提示信息
	dialogMsg: {}
}

//公共的设置
let commonSet = {
	allowMini: false
}

//go seay chaanle
let goeasyConfig = {
	channel: '',
	appkey: '7a14932a-ee96-41c5-a1cb-b00ae5582126'
}

/**
 * 初始化程序
 */
function initProgram() {
	//当检测已存在进程，则退出
	if (checkSingle()) {
		app.exit();
		return;
	}
	//获取屏幕大小
	const displays = electron.screen.getAllDisplays();
	displayHeight = displays[0].workAreaSize.height;
	displayWidth = displays[0].workAreaSize.width;
	try {
		//读取用户配置文件
		let userConfig = config.getUserSet();
		if (userConfig) {
			commonSet = userConfig;
		}
		//打开消息监听
		opneIpcMsg();
		//创建登录窗口
		createLoginWindow();
		// createDialogWindow();
		log.info('程序启动成功...');
	} catch (error) {
		log.error(error);
	}
}


/**
 *监听消息事件
 */
function opneIpcMsg() {
	//当收到Webscoket的打开客资到来消息的时候
	ipcMain.on('request-open-kz-window', (event, arg) => {
		try {
			commonVar.nowReceiveInfo = JSON.parse(arg);
			//如果收到的不是自己的消息，日志打印
			if (commonVar.nowReceiveInfo.cid != commonVar.nowLoginInfo.companyId ||
				commonVar.nowReceiveInfo.uid != commonVar.nowLoginInfo.id) {
				log.error('收到了不属于自己的消息:' + JSON.parse(commonVar.nowReceiveInfo));
				return;
			}
			//如果消息类型为接收客资
			if (commonVar.nowReceiveInfo.type === 'receive') {
				//写入日志
				log.info('新的客资消息:' + JSON.stringify(commonVar.nowReceiveInfo));
				//打开窗口
				createMsgAlertWindow(arg);
				//主窗口闪烁
				mainWindow.flashFrame(true);
				//托盘闪烁
				flashTray();
			}
		} catch (error) {
			console.log(typeof (arg))
			log.error('消息转换失败:' + arg);
		}
	})
	//收到想要获取当前客资信息的请求
	ipcMain.on('request-get-now-receive-kz-info', (event, arg) => {
		//同步返回
		event.returnValue = commonVar.nowReceiveInfo;
	})
	//收到想要获取当前客资信息的请求
	ipcMain.on('request-get-now-login-user-info', (event, arg) => {
		//同步返回
		event.returnValue = commonVar.nowLoginInfo;
	})
	//想要获取channle时
	ipcMain.on('request-get-goeasy-config', (event, arg) => {
		//同步返回
		goeasyConfig.channel = `hm_app_channel_${commonVar.nowLoginInfo.companyId}_${commonVar.nowLoginInfo.id}`;
		event.returnValue = goeasyConfig;
	})
	//当收到请求获取公司信息时
	ipcMain.on('request-get-company-info', (event, arg) => {
		//发送一个通知
		event.sender.send('response-get-company-info', arg)
	})
	//收到登录成功的请求时
	ipcMain.on('request-login-success', (event, arg) => {
		commonVar.nowLoginInfo = arg;
		//打开websockt监听
		createWebSocketWindow();
		//打开主界面
		createMainWindow();
		createTray();

	})
	//收到重新登录的请求
	ipcMain.on('request-relogin', (event, arg) => {
		reLogin();
	})
	//收到退出系统的请求
	ipcMain.on('request-exit-system', (event, arg) => {
		exitProgram();
	})
	//当点击了关闭领取客资的窗口时
	ipcMain.on('request-close-receive-window', (event, arg) => {
		if (arg == true) {
			log.info(`${commonVar.nowLoginInfo.nickName}-主动关闭了领取客资窗口`);
		}
		//关闭闪动
		flashSet.close = true;
	})
	//当点击了领取按钮时
	ipcMain.on('request-receive-kzinfo', (event, arg) => {
		//关闭闪动
		flashSet.close = true;
		//判断返回值
		if (arg.code == '100000') {
			//打开dialog窗口
			commonVar.dialogMsg = {
				type: 'success',
				body: arg.msg
			}
			createDialogWindow();
		} else {
			//打开dialog窗口
			commonVar.dialogMsg = {
				type: 'error',
				body: arg.msg
			}
			createDialogWindow();
		}
		log.info(`${commonVar.nowLoginInfo.nickName}-领取客资,结果为\n` + JSON.stringify(arg));
	})
	//axios错误
	ipcMain.on('request-axios-error', (event, arg) => {
		log.error(`axios请求错误` + JSON.stringify(arg));
		//发送钉钉消息
		postDingMsg(arg)
	})
	//show dialog
	ipcMain.on('request-show-dialog', (event, arg) => {
		commonVar.dialogMsg = arg;
		//打开dialog窗口
		createDialogWindow();
	})
	//想要获取公共信息
	ipcMain.on('request-get-dialog-msg', (event, arg) => {
		//获取提示消息内容
		event.returnValue = commonVar.dialogMsg;
	})

}
/**
 * 发送钉钉消息
 * @param {f} content 
 */
function postDingMsg(content) {
	let msg = {
		"msgtype": "text",
		"text": {
			"content": JSON.stringify(content)
		},
		"at": {
			"atMobiles": [
				// "+86-18067951532"
			],
			"isAtAll": false
		}
	}
	//发送
	axios.post(urlConfig.dingRobotUrl, msg);
}

/**
 * 系统托盘
 */
function createTray() {
	let icon = path.join(__dirname, TRAY_ICON);
	tray = new Tray(icon)
	const contextMenu = Menu.buildFromTemplate([{
		label: '最小化隐藏',
		type: 'checkbox',
		//为用户自定义的配置
		checked: commonSet.allowMini,
		click: function (menuItem, browserWindow, event) {
			commonSet.allowMini = !commonSet.allowMini;
		}
	}, {
		label: '注销',
		click: function (event) {
			reLogin();
		}
	}, {
		label: '退出',
		role: 'quit',
		// click: function (event) {
		// 	//关闭所有
		// 	exitProgram();
		// }
	}])
	tray.setToolTip('草莓卷客户端');
	tray.setContextMenu(contextMenu)
	tray.on('click', (e) => {
		if (mainWindow) {
			if (mainWindow.isMinimized() && mainWindow.isVisible()) {
				mainWindow.focus();
			} else {
				mainWindow.maximize();
				mainWindow.focus();
			}
		}
	})
}
/**
 * 托盘闪动
 */
let flashSet = {
	close: false,
	id: 0,
	show: true
}
/**
 * 托盘闪动
 */
function flashTray() {
	if (tray == null) return;
	//图标
	let icon = path.join(__dirname, TRAY_ICON);
	//透明图标
	let iconT = path.join(__dirname, TRAY_ICON_TRAN);
	//启动定时器
	flashSet.id = setInterval(() => {
		if (flashSet.show) {
			tray.setImage(iconT);
		} else {
			tray.setImage(icon);
		}
		flashSet.show = !flashSet.show;
		//当可以关闭时
		if (flashSet.close) {
			tray.setImage(icon);
			//清空并初始化
			clearInterval(flashSet.id);
			flashSet = {
				close: false,
				id: 0,
				show: true
			}
		}
	}, 500)
}

/**
 * 创建登录窗口
 */
function createLoginWindow() {
	// 创建浏览器窗口。
	loginWindow = new BrowserWindow({
		height: 520,
		width: 360,
		title: '草莓卷',
		resizable: false,
		maximizable: false,
		fullscreen: false,
		fullscreenable: false,
		movable: true,
		//隐藏菜单栏
		autoHideMenuBar: true,
		//窗口透明
		// transparent: false,
		//阴影
		hasShadow: true,
		icon: null,
		//无边框
		// frame: false,
		//是否在任务栏中显示窗口
		skipTaskbar: false,
		show: false,
		backgroundColor: '#FFF',
		webPreferences: {
			devTools: true,
			scrollBounce: true,
			webSecurity: false, // 允许跨域
		}
	})
	loginWindow.setMenu(null);
	// 然后加载应用的 index.html。
	loginWindow.loadURL(url.format({
		pathname: path.join(__dirname, LOGIN_WINDOW_URL),
		protocol: 'file:',
		slashes: true
	}))
	loginWindow.once('ready-to-show', () => {
		loginWindow.show()
	})
	// 打开开发者工具。
	if (debugModel) {
		loginWindow.webContents.openDevTools()
	}

	// 当 window 被关闭，这个事件会被触发。
	loginWindow.on('closed', () => {
		loginWindow = null;
	})
}

/**
 * webscoket监听窗口，隐藏
 */
function createWebSocketWindow() {
	websocketWindow = new BrowserWindow({
		width: 800,
		height: 600,
		show: false,
	})
	// 然后加载应用的 index.html。
	websocketWindow.loadURL(url.format({
		pathname: path.join(__dirname, WEBSOCKET_WINDOW),
		protocol: 'file:',
		slashes: true
	}))

	// 打开开发者工具。
	if (debugModel) {
		websocketWindow.webContents.openDevTools()
	}

	websocketWindow.on('closed', function () {
		websocketWindow = null
	})
}

/**
 * 创建主窗口
 */
function createMainWindow() {
	let urlParam = `/${commonVar.nowLoginInfo.token}_${commonVar.nowLoginInfo.companyId}_${commonVar.nowLoginInfo.id}_true`;
	mainWindow = new BrowserWindow({
		// width: 1024,
		// height: 768,
		minWidth: '1024',
		minHeight: '768',
		show: false,
		title: "草莓卷客户端"
	})
	//最大化
	mainWindow.maximize();
	mainWindow.setMenu(null);

	//装载网页
	mainWindow.loadURL(MAIN_WINDOW_URL + urlParam);
	//可以显示时
	mainWindow.once('ready-to-show', () => {
		let webContent = mainWindow.webContents;
		mainWindow.show();
	})
	mainWindow.on('closed', function () {
		mainWindow = null
	})
	// 打开开发者工具。
	if (debugModel) {
		mainWindow.webContents.openDevTools()
	}
	//当关闭之前
	// mainWindow.onbeforeunload = (e) => {
	// 	e.returnValue = false // 相当于 `return false` ，但是不推荐使用
	// }
	//窗口最小化
	mainWindow.on('minimize', (event) => {
		event.preventDefault();
		//只有当允许最小化时才最小化，否则隐藏
		if (!commonSet.allowMini) {
			mainWindow.minimize()
		} else {
			mainWindow.hide();
		}
	})
	//当关闭触发
	mainWindow.on('close', (event) => {
		event.preventDefault()
		dialog.showMessageBox(mainWindow, {
			title: "提示",
			message: '确定关闭草莓卷吗？',
			buttons: ['取消', '确定']
		}, (index) => {
			if (index == 1) {
				mainWindow.destroy();
				exitProgram();
			}
		});
	})
}


/**
 * 提示窗口
 * @param {*} params 
 */
function createDialogWindow(params) {
	if (dialogWindow != null) {
		dialogWindow = null;
	}
	dialogWindow = new BrowserWindow({
		width: 360,
		height: 250,
		useContentSize: true,
		skipTaskbar: true,
		resizable: false,
		maximizable: false,
		fullscreen: false,
		fullscreenable: false,
		alwaysOnTop: true,
		movable: false,
		title: "通知消息",
		acceptFirstMouse: true,
		autoHideMenuBar: true,
		transparent: false,
		show: false,
		frame: false,
		webPreferences: {
			devTools: true,
			scrollBounce: true,
			webSecurity: false, // 允许跨域
		}
	})
	// 打开开发者工具。
	if (debugModel) {
		dialogWindow.webContents.openDevTools()
	}
	dialogWindow.setMenu(null);
	//加载
	dialogWindow.loadURL(url.format({
		pathname: path.join(__dirname, DIALOG_WINDOW),
		protocol: 'file:',
		slashes: true
	}))

	dialogWindow.once('ready-to-show', () => {
		dialogWindow.show()
	})
}

/**
 * 创建消息提示窗口
 */
function createMsgAlertWindow(param) {
	msgAlertWindow = new BrowserWindow({
		height: 360,
		useContentSize: true,
		width: 500,
		skipTaskbar: true,
		resizable: false,
		maximizable: false,
		fullscreen: false,
		fullscreenable: false,
		alwaysOnTop: true,
		movable: false,
		title: "通知消息",
		acceptFirstMouse: true,
		autoHideMenuBar: true,
		transparent: false,
		show: false,
		frame: false,
		webPreferences: {
			devTools: true,
			scrollBounce: true,
			webSecurity: false, // 允许跨域
		}
	})
	msgAlertWindow.setMenu(null);
	//加载
	msgAlertWindow.loadURL(url.format({
		pathname: path.join(__dirname, MSG_ALERT_WINDOW),
		protocol: 'file:',
		query: {
			param: param
		},
		slashes: true
	}))
	//可以显示时
	msgAlertWindow.once('ready-to-show', () => {
		let x = displayWidth - 500,
			y = displayHeight - 360
		/**
		 * 关闭其他的 alert 窗口
		 */
		msgAlertWindow.setPosition(x, y)
		msgAlertWindow.show()
	})
	// 打开开发者工具。
	if (debugModel) {
		msgAlertWindow.webContents.openDevTools()
	}
}
/**
 * 创建
 */
app.on('ready', initProgram);

/**
 * 所有窗口关闭时
 */
app.on('window-all-closed', function () {
	log.info('程序退出...');
	//保存下用户设置
	config.saveUserSet(commonSet);
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

/**
 * 关闭进程
 */
function exitProgram() {
	if (tray) {
		tray.destroy();
	}
	if (loginWindow) {
		loginWindow.destroy();
	}
	if (mainWindow) {
		mainWindow.destroy();
	}
	if (msgAlertWindow) {
		msgAlertWindow.destroy();
	}
	if (websocketWindow) {
		websocketWindow.destroy();
	}
	app.quit();
}
/**
 *重新登录
 */
function reLogin() {
	if (loginWindow == null) {
		createLoginWindow();
	}
	if (tray) {
		tray.destroy();
	}
	if (mainWindow) {
		mainWindow.destroy();
	}
	if (msgAlertWindow) {
		msgAlertWindow.destroy();
	}
	if (websocketWindow) {
		websocketWindow.destroy();
	}
}
/**
 * 苹果系统
 */
app.on('activate', function () {
	if (loginWindow === null) {
		createLoginWindow();
	}
})
/**
 * 检测是否单例运行
 */

function checkSingle() {
	const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
		//若最小化则还原
		if (loginWindow) {
			if (loginWindow.isMinimized()) {
				loginWindow.restore();
			}
			loginWindow.focus();
		}
		if (mainWindow) {
			if (mainWindow.isMinimized()) {
				mainWindow.restore();
			}
			mainWindow.focus();
		}
	});
	if (shouldQuit) {
		app.quit();
	}
	return shouldQuit;
}