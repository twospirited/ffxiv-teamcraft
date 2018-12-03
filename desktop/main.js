const {app, ipcMain, BrowserWindow, Tray, nativeImage, dialog} = require('electron');
const {autoUpdater} = require('electron-updater');
const path = require('path');
const Config = require('electron-config');
const config = new Config();
const isDev = require('electron-is-dev');

const argv = process.argv.slice(1);

const BASE_APP_PATH =  path.join(__dirname, '../dist/apps/client');

let win;
let tray;
let nativeIcon;

let updateInterval;

let openedOverlays = {};

const options = {
    multi: false
};

for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--multi' || argv[i] === '-m') {
        options.multi = true;
    }
}

if (isDev) {
    // autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml');
}

if (!options.multi) {
    const shouldQuit = app.makeSingleInstance(function (commandLine, workingDirectory) {
        // Someone tried to run a second instance, we should focus our window.
        if (win && !options.multi) {
            if (win.isMinimized()) win.restore();
            win.focus();
        }
    });

    if (shouldQuit) {
        app.quit();
        return;
    }
}

function createWindow() {
    let opts = {
        show: false,
        backgroundColor: '#000',
        frame: true,
        icon: `file://${BASE_APP_PATH}/assets/logo.png`
    };
    Object.assign(opts, config.get('win:bounds'));
    if (config.get('win:alwaysOnTop')) {
        opts.alwaysOnTop = true;
    }
    win = new BrowserWindow(opts);
    if (config.get('win:fullscreen')) {
        win.maximize();
    }

    win.loadURL(`file://${BASE_APP_PATH}/index.html`);

    //// uncomment below to open the DevTools.
    //win.webContents.openDevTools();

    // Event when the window is closed.
    win.on('closed', function () {
        win = null
    });

    win.once('ready-to-show', () => {
        win.show();
        autoUpdater.checkForUpdates();
        updateInterval = setInterval(() => {
            autoUpdater.checkForUpdates();
        }, 300000);
    });

    // save window size and position
    win.on('close', () => {
        config.set('win:bounds', win.getBounds());
        config.set('win:fullscreen', win.isMaximized());
        config.set('win:alwaysOnTop', win.isAlwaysOnTop());
    });

    const iconPath = path.join(BASE_APP_PATH, 'assets/logo.png');
    nativeIcon = nativeImage.createFromPath(iconPath);
    const trayIcon = nativeIcon.resize({width: 16, height: 16});
    tray = new Tray(trayIcon);

    const handleRedirect = (e, url) => {
        if (url !== win.webContents.getURL()) {
            e.preventDefault();
            require('electron').shell.openExternal(url);
        }
    };

    win.webContents.on('will-navigate', handleRedirect);
    win.webContents.on('new-window', handleRedirect);

    tray.on('click', () => {
        win.isVisible() ? win.hide() : win.show()
    });
    win.on('show', () => {
        tray.setHighlightMode('always')
    });
    win.on('hide', () => {
        tray.setHighlightMode('never')
    });
    tray.on('balloon-click', () => {
        !win.isVisible() ? win.show() : null;
    });
}

ipcMain.on('app-ready', (event) => {
    if (options.nativeDecorator) {
        event.sender.send('window-decorator', false);
    }
});

// Create window on electron intialization
app.on('ready', () => {
    createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {

    // On macOS specific close process
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', function () {
    // macOS specific close process
    if (win === null) {
        createWindow()
    }
});

autoUpdater.on('checking-for-update', () => {
    win.webContents.send('checking-for-update', true);
});

autoUpdater.on('download-progress', (progress) => {
    win.webContents.send('download-progress', progress);
});

autoUpdater.on('update-available', () => {
    win.webContents.send('update-available', true);
});

autoUpdater.on('update-not-available', () => {
    win.webContents.send('update-available', false);
});

autoUpdater.on('update-downloaded', () => {
    clearInterval(updateInterval);
    dialog.showMessageBox({
        type: 'info',
        title: 'FFXIV Teamcraft - Update available',
        message: 'An update is available and downloaded, install now?',
        buttons: ['Yes', 'No']
    }, (buttonIndex) => {
        if (buttonIndex === 0) {
            autoUpdater.quitAndInstall();
        }
    });
});

ipcMain.on('notification', (event, config) => {
    // Override icon for now, as getting the icon from url doesn't seem to be working properly.
    config.icon = nativeIcon;
    tray.displayBalloon(config);
});

ipcMain.on('run-update', () => {
    autoUpdater.quitAndInstall(true, true);
});

ipcMain.on('always-on-top', (event, onTop) => {
    win.setAlwaysOnTop(onTop, 'floating');
});

ipcMain.on('always-on-top:get', (event) => {
    event.sender.send('always-on-top:value', win.alwaysOnTop);
});

ipcMain.on('always-on-top', (event, onTop) => {
    win.setAlwaysOnTop(onTop, 'floating');
});

ipcMain.on('always-on-top:get', (event) => {
    event.sender.send('always-on-top:value', win.alwaysOnTop);
});

ipcMain.on('overlay', (event, url) => {
    let opts = {
        show: false,
        resizable: true,
        frame: false,
        alwaysOnTop: true,
        autoHideMenuBar: true
    };
    Object.assign(opts, config.get(`overlay:${url}:bounds`));
    opts.opacity = config.get(`overlay:${url}:opacity`) || 1;
    const overlay = new BrowserWindow(opts);

    overlay.once('ready-to-show', () => {
        overlay.show();
    });

    // save window size and position
    overlay.on('close', () => {
        config.set(`overlay:${url}:bounds`, overlay.getBounds());
        config.set(`overlay:${url}:opacity`, overlay.getOpacity());
    });


    overlay.loadURL(`file://${BASE_APP_PATH}/index.html#${url}?overlay=true`);
    openedOverlays[url] = overlay;
});

ipcMain.on('overlay:set-opacity', (event, data) => {
    const overlayWindow = openedOverlays[data.uri];
    if (overlayWindow !== undefined) {
        overlayWindow.setOpacity(data.opacity);
    }
});

ipcMain.on('overlay:get-opacity', (event, data) => {
    const overlayWindow = openedOverlays[data.uri];
    if (overlayWindow !== undefined) {
        event.sender.send(`overlay:${data.uri}:opacity`, overlayWindow.getOpacity());
    }
});

ipcMain.on('overlay-close', (event, url) => {
    if (openedOverlays[url] !== undefined) {
        openedOverlays[url].close();
    }
});

ipcMain.on('fullscreen-toggle', () => {
    if (win.isMaximized()) {
        win.unmaximize();
    } else {
        win.maximize();
    }
});

ipcMain.on('minimize', () => {
    win.minimize();
});

ipcMain.on('update:check', () => {
    autoUpdater.checkForUpdates();
});