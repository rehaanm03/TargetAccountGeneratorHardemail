// Requires all the Modules needed
// const puppeteer = require('puppeteer');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { machineId, machineIdSync } = require('node-machine-id');
const { Webhook, MessageBuilder } = require('webhook-discord');
const puppeteer = require('puppeteer-extra');
const randomInt = require('random-int');
const date = require('date-and-time');
const delay = require('delay');
const chalk = require("chalk");
const fs = require('fs');
var appVersion = "2.8"

try {
  puppeteer.use(StealthPlugin())
} catch (e) {
  console.log(chalk.red(e.message))
}


const folderName = `${__dirname}/SuccessfullAccounts`
try {
  if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName)
  }
} catch (err) {
  console.error(err)
}


var successFile = `${__dirname}/SuccessfullAccounts/successAccounts.csv`;
var accountFile = `${__dirname}/Accounts.csv`;
var proxyFile = `${__dirname}/proxy.txt`
// If CSV file does not exist, create it and add the headers
if (!fs.existsSync(successFile)) {
  fs.writeFileSync(successFile, `firstName,lastName,Email,Password\n`);
}
if (!fs.existsSync(accountFile)) {
  fs.writeFileSync(accountFile, `firstName,lastName,Email,Password\n`);
}
if (!fs.existsSync(proxyFile)) {
  fs.writeFileSync(proxyFile, ``);
}

var fNames = [];
var lNames = [];
var emails = [];
var passwords = [];
var gotAccountInfo = false;

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function writeToLogs(tn, string) {
  if (!tn && !string) fs.appendFileSync('logs.txt', `\n`)
  else fs.appendFileSync('logs.txt', `[${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')}] [Task ${tn}] ${string} \n`)
}

function log(tn, string) {
  console.log(chalk.yellow.bold(`[${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')}] [Task ${tn}] ${string}`))
  writeToLogs(tn, string)
}

function prettyPrint(tn, string) {
  console.log(chalk.cyan.bold(`[${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')}] [Task ${tn}] ${string}`))
  writeToLogs(tn, string)
}

function bad(tn, string) {
  console.log(chalk.red.bold(`[${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')}] [Task ${tn}] ${string}`))
  writeToLogs(tn, string)
}

function good(tn, string) {
  console.log(chalk.green.bold(`[${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')}] [Task ${tn}] ${string}`))
  writeToLogs(tn, string)
}

// Gets the Users info like name, catchall, captchakey, and etc
var settings = JSON.parse(fs.readFileSync(__dirname + '/settings.json'));
const authkey = settings["Key"]
var headless = settings["Headless"]
var proxy = settings["Proxy"]
if (headless !== true && headless !== false) {
  headless = false
}
if (proxy !== true && proxy !== false) {
  proxy = false
}
var userWebhook = "";
if (settings["DiscordWebhook"].length > 20) {
  userWebhook = new Webhook(settings["DiscordWebhook"]);
} else {
  console.log(chalk.red(`[${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')}] Error Invalid Webhook, Please Fix In The "settings.json" File`))
}

const agents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.152 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.152 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.152 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; SM-N960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.152 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36",
  "Mozilla/5.0 (Linux; Android 7.0; SM-G930VC Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/58.0.3029.83 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 6.0.1; SM-G935S Build/MMB29K; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/55.0.2883.91 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 6.0.1; SM-G920V Build/MMB29K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.98 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 5.1.1; SM-G928X Build/LMY47X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.83 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 6P Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.83 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 8.0.0; SM-G960F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.84 Mobile Safari/537.36"
]


// This function is the main function
async function task(i) {
  // console.log(i)
  if (gotAccountInfo == false) {
    log(`Starting`, `Getting Accounts From the "Accounts.csv" File`)
    var fileContent = fs.readFileSync(`${__dirname}/Accounts.csv`);
    fileContent = fileContent.toString()
    splitAccounts = fileContent.split('\n')
    for (a = 1; a < splitAccounts.length; a++) {
      // console.log(splitAccounts[i]);
      let accountInfo = splitAccounts[a].split(",");
      // console.log(`First Name: ${accountInfo[0]}`);
      // console.log(`Last Name: ${accountInfo[1]}`);
      // console.log(`Email: ${accountInfo[2]}`);
      // console.log(`Password: ${accountInfo[3]}`);
      fNames.push(accountInfo[0]);
      lNames.push(accountInfo[1]);
      emails.push(accountInfo[2]);
      passwords.push(accountInfo[3]);
    }
    gotAccountInfo = true;
  }
  // console.log(fNames);
  var fileContent = fs.readFileSync(`${__dirname}/Accounts.csv`);
  // console.log(fileContent.toString())
  fileContent = fileContent.toString()
  splitAccounts = fileContent.split('\n')
  // console.log(splitAccounts.length)
  if (i == splitAccounts.length - 1) {
    good(`Starting`, `Successfully Genned All Accounts`)
    return
  }
  if (!fNames[i] || !lNames[i] || !emails[i] || !passwords[i]) {
    good(`Starting`, `Successfully Genned All Accounts`)
    return
  }
  // return
  const tn = randomInt(10, 9999)
  try {
    writeToLogs(tn, ``)
    writeToLogs(tn, `Starting`)
    writeToLogs(tn, `Using Headless Mode: ${headless}`)
    writeToLogs(tn, `Using Proxy Mode: ${proxy}`)
  } catch (e) {}
  // '--disable-features=site-per-process'
  // '--proxy-server=' + proxys[randomInt(0, 24)]
  // '--user-agent=' + agents[randomInt(0, 4)]
  // '--user-agent=' + userAgent.toString()]
  // `--window-size=${options.width},${options.height}`
  var arguments = [`--window-size=500,200`, `--user-agent=${agents[randomInt(0, agents.length - 1)]}`]
  var proxyList = [];
  var fullProxy = "N/A";
  var proxyIsUserPass = false;
  var proxyUsername = "";
  var proxyPassword = "";
  log(tn, ``)
  if (proxy == true) {
    log(tn, `Getting Proxys`)
    rawProxyData = fs.readFileSync(__dirname + '/proxy.txt')
    var proxyListData = rawProxyData.toString()
    if (proxyListData == "") {
      bad(tn, `Proxy List is Empty`)
      return
    }
    // var proxyListObject = proxyListData.split('\r\n')
    var proxyListObject = proxyListData.split('\n')
    // if (proxyListObject.length == 0) {
    //   console.log("Splitting")
    //   var proxyListObject = proxyListData.split('\r\n')
    // }
    for (let i = 0; i < proxyListObject.length; i++) {
      let tempProxy = proxyListObject[i]
      if (tempProxy.endsWith("\r")) {
        var proxyListObject = proxyListData.split('\r\n')
      }
      proxyList.push(proxyListObject[i])
    }
    if (proxyList.length > 1) {
      proxyList.pop()
    }
    var randomProxy = proxyList[randomInt(0, proxyList.length - 1)]
    var splitProxy = randomProxy.split(':')
    var fullProxy = `http://${splitProxy[0]}:${splitProxy[1]}`;
    var fullProxyWebhook = `http://${splitProxy[0]}:${splitProxy[1]}`;
    if (splitProxy[2] && splitProxy[3]) {
      prettyPrint(tn, `User Pass Proxy Detected, Continuing`)
      // var fullProxyWebhook = `http://${splitProxy[0]}:${splitProxy[1]}:${splitProxy[2]}:${splitProxy[3]}`;
      proxyIsUserPass = true;
      var proxyUsername = splitProxy[2];
      var proxyPassword = splitProxy[3];
    }
    prettyPrint(tn, `Using Proxy: ${fullProxy}`)
    arguments = [`--window-size=500,200`, `--user-agent=${agents[randomInt(0, agents.length - 1)]}`, `--proxy-server=${fullProxy}`]

  }
  if (headless !== true && headless !== false) {
    // console.log(headless)
    bad(tn, `Make Sure The Headless Value in the \'settings.json\' File is Equal to true or false\nTrue means the Browser Would Show\nFalse means the Browser Won\'t Show\nI highly recommend keeping the value false`)
  } else if (proxy !== true && proxy !== false) {
    // console.log(proxy)
    bad(`Make Sure The Proxy Value in the \'settings.json\' File is Equal to true or false\nTrue Means You want to use Proxys\nFalse Means you Don\'t want to use proxys`)
  }

  try {
    writeToLogs(tn, `Started`)
  } catch (e) {}
  const accountFirstName = fNames[i];
  const accountLastName = lNames[i];
  const accountEmail = emails[i];
  const accountPassword = passwords[i];

  const browser = await puppeteer.launch({
    args: arguments,
    defaultViewport: null,
    headless: headless
  });
  const page = await browser.newPage();

  if (proxyIsUserPass && proxy) {
    await page.authenticate({
      username: proxyUsername,
      password: proxyPassword
    });
  }

  // Creates a new page and goes to the registration page
  try {
    await page.goto('https://www.target.com/circle?ref=sr_shorturl_circle', {
      timeout: 0
    });
  } catch (e) {
    bad(tn, `${e.message}`)
    bad(tn, `Bad Proxy, Retrying...`)
    await browser.close();
    await delay(200);
    await task(i);
    return
  }

  
  try {
    log(tn, `Heading to Sign Up`)
    log(tn, `First Name: ${accountFirstName}`)
    log(tn, `Last Name: ${accountLastName}`)
    log(tn, `Email: ${accountEmail}`)
    log(tn, `Password: ${accountPassword}`)    
  } catch (e) {}

  await page.waitFor(2500)
  try {
    await page.waitForXPath("//*[contains(text(), 'Create account')]")
  } catch (e) {
    bad(tn, `${e.message}`)
    bad(tn, `Bad Proxy, Retrying...`)
    await browser.close();
    await delay(200);
    await task(i);
    return
  }
  // .then(() => console.log('Create Button is there'))
  // const createaccountbutton = await page.$x("//*[contains(text(), 'Create account')]")
  // await createaccountbutton[0].click()
  const linkHandlers = await page.$x("//*[contains(text(), 'Create account')]");

  if (linkHandlers.length > 0) {
    await linkHandlers[0].click();
  } else {
    throw new Error("Create Button Not Found");
  }

  await page.waitFor(200)
  await page.waitForSelector('#createAccount', {
    timeout: 0
  })
  await page.waitFor(200)

  try {
    log(tn, `Creating Account`)
  } catch (e) {}

  const emailselector = await page.$x("//*[contains(text(), 'Email address')]")
  if (emailselector.length > 0) {
    // The Email TextBox is already focused
    await page.keyboard.type(accountEmail, {
      delay: 50
    })
  }
  await page.keyboard.press('Tab')
  await page.keyboard.type(accountFirstName, {
    delay: 30
  })
  await page.keyboard.press('Tab')
  await page.keyboard.type(accountLastName, {
    delay: 30
  })
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.type(accountPassword, {
    delay: 30
  })
  await page.click('#createAccount')
  await page.waitFor(2500)

  var keepmesignedin = await page.$x("/html/body/div[1]/div[2]/div/div[1]/div/div[2]/div/div/div")
  const theanitbotmessage = await page.$x("//*[contains(text(), 'Sorry, something went wrong. Please try again.')]")
  alert = page.$('#root > div > div.styles__AuthContainerWrapper-sc-1eq9g2f-1.drifUu > div > div.sc-cJSrbW.euqszf > div > div')
  var blocked = 0

  if (keepmesignedin.length > 0 && keepmesignedin.length < 5) {
    // console.log(keepmesignedin);
    // var xpathData = await page.$x(`xpathSelector`);
    var xpathTextContent = await keepmesignedin[0].getProperty('textContent'), text = await xpathTextContent.jsonValue();
    // console.log(text)
    if (text == "That Target.com account already exists. You can Sign In or reset your password.") {
      try {
        bad(tn, `That Target.com account already exists. You can Sign In or reset your password.`)
      } catch (e) {}

      await browser.close();
      await delay(200);
      // i++;
      await task(i + 1);
      return
    }
    await blockedFunction()
  }
  // console.log(keepmesignedin.length)
  // console.log(keepmesignedin2.length)


  const success = new MessageBuilder()
    .setName(`Rehaan Account Generator V${appVersion}`)
    .setColor('#FF0000')
    .setTitle('Account Successfully Made')
    .setThumbnail("https://media.discordapp.net/attachments/697695144199061504/772389436885172224/451px-Target_logo.svg.png?width=356&height=473")
    .addField('Site', 'Target', true)
    .addField('Headless', headless, true)
    .addField('Proxy', `||${fullProxy}||`, true)
    .addField('Name', `${accountFirstName} ${accountLastName}`, true)
    .addField('Email', accountEmail, true)
    .addField('Password', `||${accountPassword}||`, true)
    .addField('Task:', tn, true)
    .addField('Blocked', `${blocked} Time(s)`, true)
    .setFooter('Powered By: Rehaanm03#8677', 'https://cdn.discordapp.com/attachments/697695144199061504/701151541389819995/new_pfp4.png')
    .setTime();


  await page.waitForSelector('#circle-skip', {
    timeout: 0
  });
  await page.waitFor(200);
  // if (page.url() == 'https://www.target.com/') {
    try {
    good(tn, `Account Created`)
  } catch (e) {}

  if (userWebhook !== "") {
    userWebhook.send(success);
  } else {
    bad(tn, `Invalid Webhook, Please Fix In The "settings.json" File`)
  }

  try {
    good(tn, `Sent Webhook`)
  } catch (e) {}

  try { fs.appendFileSync(`${__dirname}/SuccessfullAccounts/emailPass.txt`, `${accountEmail}:${accountPassword}\n`);                                              } catch (e) { bad(tn, `${e.message}`) }
  try { fs.appendFileSync(`${__dirname}/SuccessfullAccounts/nameEmailPass.txt`, `${accountFirstName}:${accountLastName}:${accountEmail}:${accountPassword}\n`);   } catch (e) { bad(tn, `${e.message}`) }
  try { fs.appendFileSync(`${__dirname}/SuccessfullAccounts/email.txt`, `${accountEmail}\n`);                                                                     } catch (e) { bad(tn, `${e.message}`) }
  try { fs.appendFileSync(`${__dirname}/SuccessfullAccounts/password.txt`, `${accountPassword}\n`);                                                               } catch (e) { bad(tn, `${e.message}`) }
  try { fs.appendFileSync(`${__dirname}/SuccessfullAccounts/firstname.txt`, `${accountFirstName}\n`);                                                             } catch (e) { bad(tn, `${e.message}`) }
  try { fs.appendFileSync(`${__dirname}/SuccessfullAccounts/lastname.txt`, `${accountLastName}\n`);                                                               } catch (e) { bad(tn, `${e.message}`) }
  try { fs.appendFileSync(`${__dirname}/SuccessfullAccounts/successAccounts.csv`, `${accountFirstName},${accountLastName},${accountEmail},${accountPassword}\n`); } catch (e) { bad(tn, `${e.message}`) }

  good(tn, `Added Account to /SuccessfullAccount Folder`)

  await browser.close();
  await delay(200);
  i++;
  await task(i);

  async function blockedFunction() {
    try { bad(tn, `Caught by Anti-Bot`) } catch (e) {}

    blocked = blocked + 1
    var time = randomInt(5, 10)
    if (blocked > 1) {
      var time = randomInt(16, 26)
    }
    var waitingTime = time * 60000
    try { log(tn, `Waiting for ${time} Minute(s)`) } catch (e) {}

    const failure = new MessageBuilder()
      .setName(`Rehaan Account Generator V${appVersion}`)
      .setColor('#FF0000')
      .setTitle('Blocked By Anti-Bot')
      .setThumbnail("https://media.discordapp.net/attachments/697695144199061504/772389436885172224/451px-Target_logo.svg.png?width=356&height=473")
      .addField('Site', 'Target', true)
      .addField('Headless', headless, true)
      .addField('Proxy', fullProxy, true)
      .addField('Task:', tn, true)
      .addField('Time:', `${time} Minute(s)`, true)
      .addField('Blocked', `${blocked} Time(s)`, true)
      .setFooter('Powered By: Rehaanm03#8677', 'https://cdn.discordapp.com/attachments/697695144199061504/701151541389819995/new_pfp4.png')
      .setTime();

    if (userWebhook !== "") {
      userWebhook.send(failure);
    } else {
      bad(tn, `Invalid Webhook, Please Fix In The "settings.json" File`)
    }
    await page.waitFor(waitingTime)
    await page.click('#username')
    await page.keyboard.press('Tab')
    await page.waitFor(500)
    await page.keyboard.press('Tab')
    await page.waitFor(200)
    // await page.click(keepmesignedin)
    await page.waitFor(4000)
    await page.click('#createAccount')
    // console.log(keepmesignedin2.length)
    await page.waitFor(5500)
    const skipbutton = await page.$x("//*[contains(text(), 'Skip')]")
    // theanitbotmessage == "Sorry, something went wrong. Please try again." || theanitbotmessage !== undefined || theanitbotmessage !== null
    if (skipbutton.length > 0) {
      try { good(tn, `Yay, Unblocked by Anti-Bot`) } catch (e) {}
    } else if (skipbutton.length == 0) {
      await blockedFunction()
    } else {
      try { bad(tn, `Error`) } catch (e) {}
    }
  }
};


good(``, `Welcome Back`)
task(0)