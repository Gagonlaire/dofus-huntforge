import chalk from "chalk";

export const mapCoordinatesBounds = {
    minX: -88,
    minY: -70,
    maxX: 36,
    maxY: 48,
}

export const defaultSavePath = './dist';

export const pageLoggingColors = [
    chalk.hex('#e67e22'),
    chalk.hex('#2ecc71'),
    chalk.hex('#3498db'),
    chalk.hex('#9b59b6'),
    chalk.hex('#f1c40f'),
    chalk.hex('#e74c3c'),
    chalk.hex('#1abc9c'),
]

export const saveFiles = {
    data: 'data.json',
    nameIdData: 'nameIdData.json',
    excludedCoordinates: 'excludedCoordinates.json'
};

export const selectors = {
    modalContent: 'body > div.q-dialog.fullscreen.no-pointer-events.q-dialog--modal > div.q-dialog__inner.flex.no-pointer-events.q-dialog__inner--minimized.q-dialog__inner--standard.fixed-full.flex-center > div > div.column.q-pa-md > div',
    modalValidateButton: 'body > div.q-dialog.fullscreen.no-pointer-events.q-dialog--modal > div.q-dialog__inner.flex.no-pointer-events.q-dialog__inner--minimized.q-dialog__inner--standard.fixed-full.flex-center > div > div.q-card__actions.q-mt-md.q-card__actions--horiz.row.justify-end > button',
    hintPositionFields: '.q-field__native',
    hintDirectionButtons: '.treasure-hunt-direction-icon',
}

export const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:102.0) Gecko/20100101 Firefox/102.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edg/116.0.1938.81",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 12; SM-G991U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.153 Mobile Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.5790.102 Safari/537.36",
    "Mozilla/5.0 (iPad; CPU OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:115.0) Gecko/20100101 Firefox/115.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15"
]

export const header = '\n\n  ██████  ▄████▄   ██▀███   ▄▄▄       ██▓███  ▓█████  ██▀███  \n' +
    '▒██    ▒ ▒██▀ ▀█  ▓██ ▒ ██▒▒████▄    ▓██░  ██▒▓█   ▀ ▓██ ▒ ██▒\n' +
    '░ ▓██▄   ▒▓█    ▄ ▓██ ░▄█ ▒▒██  ▀█▄  ▓██░ ██▓▒▒███   ▓██ ░▄█ ▒\n' +
    '  ▒   ██▒▒▓▓▄ ▄██▒▒██▀▀█▄  ░██▄▄▄▄██ ▒██▄█▓▒ ▒▒▓█  ▄ ▒██▀▀█▄  \n' +
    '▒██████▒▒▒ ▓███▀ ░░██▓ ▒██▒ ▓█   ▓██▒▒██▒ ░  ░░▒████▒░██▓ ▒██▒\n' +
    '▒ ▒▓▒ ▒ ░░ ░▒ ▒  ░░ ▒▓ ░▒▓░ ▒▒   ▓▒█░▒▓▒░ ░  ░░░ ▒░ ░░ ▒▓ ░▒▓░\n' +
    '░ ░▒  ░ ░  ░  ▒     ░▒ ░ ▒░  ▒   ▒▒ ░░▒ ░      ░ ░  ░  ░▒ ░ ▒░\n' +
    '░  ░  ░  ░          ░░   ░   ░   ▒   ░░          ░     ░░   ░ \n' +
    '      ░  ░ ░         ░           ░  ░            ░  ░   ░     \n' +
    '         ░                                                    \n\n'

export const footer = '\n\n ███▄    █  ▒█████  ▄▄▄█████▓▓█████ \n' +
    ' ██ ▀█   █ ▒██▒  ██▒▓  ██▒ ▓▒▓█   ▀ \n' +
    '▓██  ▀█ ██▒▒██░  ██▒▒ ▓██░ ▒░▒███   \n' +
    '▓██▒  ▐▌██▒▒██   ██░░ ▓██▓ ░ ▒▓█  ▄ \n' +
    '▒██░   ▓██░░ ████▓▒░  ▒██▒ ░ ░▒████▒\n' +
    '░ ▒░   ▒ ▒ ░ ▒░▒░▒░   ▒ ░░   ░░ ▒░ ░\n' +
    '░ ░░   ░ ▒░  ░ ▒ ▒░     ░     ░ ░  ░\n' +
    '   ░   ░ ░ ░ ░ ░ ▒    ░         ░   \n' +
    '         ░     ░ ░              ░  ░\n' +
    '                                    \n\n'

export const printFooter = () => {
    console.log(chalk.red(footer))
    console.log(`Thanks for using this tool, if you have any feedback or suggestion, feel free to open an issue at ${chalk.bold.blue('https://github.com/Gagonlaire/dofus-huntforge/issues/new')}`)
    console.log(`Please take in consideration that ${chalk.bold.red('you are responsible of ALL data you got from this tool')}, use it wisely and don't share it with anyone.`)
}
