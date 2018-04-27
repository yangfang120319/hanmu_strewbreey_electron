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
const electron = require('electron')
const log = require('./app/main/log-util');
const config = require('./app/main/config');
const path = require('path')
const url = require('url')

//debug模式
const debugModel = true;

//页面地址
const LOGIN_WINDOW_URL = 'app/view/login.html';
const MAIN_WINDOW_URL = 'http://114.55.249.156/login/';
const MSG_ALERT_WINDOW = 'app/view/alert.html';
const WEBSOCKET_WINDOW = 'app/view/websocket.html';

//创建的所有窗口及图标
let tray = null
let loginWindow = null;
let mainWindow = null;
let msgAlertWindow = null;
let websocketWindow = null;

//获取窗口大小
let displayHeight;
let displayWidth;

/**
 * 所有全局共享的变量
 */
let commonVar = {
	//当前收到的客资信息
	nowReceiveKZInfo: '',
	//公司信息
	companyInfo: '',
	//用户信息
	userInfo: '',
	//当前登录信息
	nowLoginInfo: ''
}

//公共的设置
let commonSet = {
	allowMini: false
}


/**
 * 初始化程序
 */

function initProgram() {
	if (checkSingle()) return;
	const displays = electron.screen.getAllDisplays();
	displayHeight = displays[0].workAreaSize.height;
	displayWidth = displays[0].workAreaSize.width;
	//监听消息
	try {
		//读取用户配置文件
		let userConfig = config.getUserSet();
		if (userConfig) {
			commonSet = userConfig;
		}
		opneIpcMsg();
		createLoginWindow();
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
		commonVar.nowReceiveKZInfo = arg;
		//打开窗口
		createMsgAlertWindow(arg);
	})
	//收到想要获取当前客资信息的请求
	ipcMain.on('request-get-now-receive-kz-info', (event, arg) => {
		//同步返回
		event.returnValue = commonVar.nowReceiveKZInfo;
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
}

/**
 * 系统托盘
 */
function createTray() {
	let icon = path.join(__dirname, 'app/static/icons/icon.ico');
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
 * 创建登录窗口
 */
function createLoginWindow() {
	// 创建浏览器窗口。
	loginWindow = new BrowserWindow({
		height: 520,
		width: 360,
		title: '草莓卷',
		// resizable: false,
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
	websocketWindow.on('closed', function () {
		console.log('窗口关闭')
		websocketWindow = null
	})
}

/**
 * 创建主窗口
 */
function createMainWindow() {
	let urlParam = `${commonVar.nowLoginInfo.token}_${commonVar.nowLoginInfo.companyId}_${commonVar.nowLoginInfo.id}`;
	mainWindow = new BrowserWindow({
		// width: 1024,
		// height: 768,
		show: false,
		title: "草莓卷客户端"
	})
	//最大化
	mainWindow.maximize();
	//装载网页
	mainWindow.loadURL(MAIN_WINDOW_URL + urlParam);
	//可以显示时
	mainWindow.once('ready-to-show', () => {
		mainWindow.show()
	})
	mainWindow.on('closed', function () {
		console.log('窗口关闭')
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
	createLoginWindow();
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