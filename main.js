const {
	app,
	Menu,
	Tray,
	dialog,
	BrowserWindow,
	ipcMain,
	Notification
} = require('electron')
const electron = require('electron')

const path = require('path')
const url = require('url')

//debug模式
const debugModel = true;

//页面地址
const LOGIN_WINDOW_URL = 'app/view/login.html';
const MAIN_WINDOW_URL = '';
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
		//打开websockt监听
		//打开主界面
	})
}

/**
 * 创建系统窗口
 */
function createWindow() {
	const displays = electron.screen.getAllDisplays();
	displayHeight = displays[0].workAreaSize.height;
	displayWidth = displays[0].workAreaSize.width;
	//监听消息
	opneIpcMsg();
	createLoginWindow();
	// createMainWindow();
	// createTray();
	// createMsgAlertWindow();
	// createWebSocketWindow();

}

/**
 * 系统托盘
 */
function createTray() {
	let icon = path.join(__dirname, 'app/static/icons/icon.ico');
	tray = new Tray(icon)
	const contextMenu = Menu.buildFromTemplate([{
			label: '注销',
			click: function (event) {
				createLoginWindow();
			}
		},
		{
			label: '退出',
			click: function (event) {
				tray.destroy()
			}
		}
	])
	tray.setToolTip('This is my application.')
	tray.setContextMenu(contextMenu)
	tray.on('click', (e) => {
		if (mainWindow && mainWindow.isVisible()) {
			mainWindow.show()
		}
		// win = null
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
	//当关闭之前
	loginWindow.onbeforeunload = (e) => {
		e.returnValue = false // 相当于 `return false` ，但是不推荐使用
	}
	//当关闭触发
	let confirmClose = false;
	loginWindow.on('close', (event) => {
		if (!confirmClose) {
			event.preventDefault()
			dialog.showMessageBox(loginWindow, {
				title: "提示",
				message: '确定关闭草莓卷吗？',
				buttons: ['取消', '确定']
			}, (index) => {
				if (index == 1) {
					confirmClose = true;
					loginWindow.close();
				}
			});
		}
	})
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
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		show: false,
	})
	mainWindow.loadURL(MAIN_WINDOW_URL);
	mainWindow.on('closed', function () {
		console.log('窗口关闭')
		mainWindow = null
	})
	// 打开开发者工具。
	if (debugModel) {
		msgAlertWindow.webContents.openDevTools()
	}
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
app.on('ready', createWindow)

/**
 * 所有窗口关闭时
 */
app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

// app.on('activate', function () {
// 	if (mainWindow === null) {
// 		createWindow()
// 	}
// })