// const chromium = require('chrome-aws-lambda');
import chromium from 'chrome-aws-lambda';
import moment from 'moment';

const getRandomNumber = () => Math.ceil(Math.random() * 30);

const sleep = async (seconds: number) => new Promise((resolve) => setTimeout(
    () => resolve(true), seconds * 1000,
));

// eslint-disable-next-line import/prefer-default-export
export const autoReport = async () => {
    try {
        const randomSleepSeconds = getRandomNumber();
        console.log(`[Message]: Starting to sleep for ${randomSleepSeconds} seconds`);
        await sleep(randomSleepSeconds);
        console.log(`[Message]: Finish to sleep for ${randomSleepSeconds} seconds`);
        const {
            url,
            email,
            password,
        } = process.env;
        if (!url || !email || !password) {
            throw new Error('Missing parameters.');
        }
        const browser = await chromium.puppeteer.launch({
            args: [
                ...chromium.args,
                '--lang=en-US',
            ],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            // headless: true,
            headless: false,
            ignoreHTTPSErrors: true,
        });
        const page = (await browser.pages())[0] || await browser.newPage();
        console.log(`[Message]: Navigate to ${url}`);
        await page.goto(url, { waitUntil: 'networkidle0' });
        console.log(`[Message]: Navigate to ${url} succeed.`);
        await page.waitForSelector('#i0116', { timeout: 60000 });
        await page.focus('#i0116');
        await page.keyboard.type(email);
        await page.click('#idSIButton9');
        await page.waitForTimeout(1000);
        await page.waitForSelector('#i0118', { timeout: 60000 });
        await page.focus('#i0118');
        await page.keyboard.type(password);
        await page.waitForSelector('input[value="Sign in"]', { timeout: 60000 });
        await page.waitForSelector('input[value="Sign in"]', { timeout: 60000 });
        await page.click('input[value="Sign in"]');
        console.log('[Message]: Login successfully.');
        await page.waitForSelector('input[value="Yes"]', { timeout: 60000 });
        await page.click('input[value="Yes"]');
        await page.waitForTimeout(2000);
        // const currentTime = moment();
        const currentTime = moment('2021-05-03 00:00:00');
        console.log(`[Message]: Current time is ${currentTime.toDate()}`);
        await page.waitForSelector('input[value="正常"]', { timeout: 60000 });
        await page.click('input[value="正常"]');
        console.log('[Message]: 身體狀況選擇 正常');
        await page.waitForTimeout(1000);
        if (currentTime.hours() > 2) {
            console.log('[Message]: This is night report.');
            await page.waitForSelector('input[value="晚上下班前填寫"]', { timeout: 60000 });
            await page.click('input[value="晚上下班前填寫"]');
            console.log('[Message]: 本次填寫時段選擇 晚上下班前填寫');
        } else if (currentTime.day() === 1) {
            console.log('[Message]: This is morning report on Monday.');
            await page.waitForSelector('input[value="假日後上班(週一早上請選此項)"]', { timeout: 60000 });
            await page.click('input[value="假日後上班(週一早上請選此項)"]');
            console.log('[Message]: 本次填寫時段選擇 假日後上班(週一早上請選此項)');
            await page.waitForTimeout(1000);
            await page.waitForSelector('input[value="在家休息無外出"]', { timeout: 60000 });
            await page.click('input[value="在家休息無外出"]');
            console.log('[Message]: 假日活動地點選擇 在家休息無外出');
            await page.waitForTimeout(1000);
            await page.waitForSelector('input[value="ECV辦公室"]', { timeout: 60000 });
            await page.click('input[value="ECV辦公室"]');
            console.log('[Message]: 工作地點選擇 ECV辦公室');
        } else {
            console.log('[Message]: This is morning report except on Monday.');
            await page.waitForSelector('input[value="早上上班前填寫"]', { timeout: 60000 });
            await page.click('input[value="早上上班前填寫"]');
            console.log('[Message]: 本次填寫時段選擇 早上上班前填寫');
            await page.waitForTimeout(1000);
            await page.waitForSelector('input[value="ECV辦公室"]', { timeout: 60000 });
            await page.click('input[value="ECV辦公室"]');
            console.log('[Message]: 工作地點選擇 ECV辦公室');
        }
        await page.waitForTimeout(1000);
        await page.waitForSelector('input[value="直接回家不繞路"]', { timeout: 60000 });
        await page.click('input[value="直接回家不繞路"]');
        console.log('[Message]: 今晚預計移動地點選擇 直接回家不繞路');
        // const image = await page.screenshot({ encoding: 'base64' })
        // console.log(image)
        await page.waitForTimeout(1000);
        await page.waitForSelector('input[value="是"]', { timeout: 60000 });
        await page.click('input[value="是"]');
        console.log('[Message]: 是否填寫工時表選擇 是');
        await page.waitForTimeout(1000);
        await page.waitForSelector('input[type="checkbox"]', { timeout: 60000 });
        await page.click('input[type="checkbox"]');
        console.log('[Message]: 勾選回條');
        await page.waitForSelector('button[title="Submit"]', { timeout: 60000 });
        await page.click('button[title="Submit"]');
        // await browser.close();
        console.log('[Message]: Auto report succeed.');
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};
