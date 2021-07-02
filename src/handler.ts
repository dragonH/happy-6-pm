// const chromium = require('chrome-aws-lambda');
import { Authenticator } from 'otplib/core';
import { keyDecoder, keyEncoder } from '@otplib/plugin-thirty-two';
import { createDigest, createRandomBytes } from '@otplib/plugin-crypto';
import chromium from 'chrome-aws-lambda';
import moment from 'moment';

const getRandomNumber = () => Math.ceil(Math.random() * 30);

const sleep = async (seconds: number) => new Promise((resolve) => setTimeout(
    /** This function is to wait for a period of time */
    () => resolve(true), seconds * 1000,
));

const getMFAToken = async (
    MFASecret: string,
) => {
    /** This function is to get mfa token */
    try {
        const authenticator = new Authenticator({
            createDigest,
            createRandomBytes,
            keyDecoder,
            keyEncoder,
        });
        const token = authenticator.generate(MFASecret);
        return token;
    } catch (error) {
        console.error(error);
        throw Error('Error Whilee Get MAF Token.');
    }
};

// eslint-disable-next-line import/prefer-default-export
export const autoReport = async () => {
    /** This function is to process auto report */
    try {
        const randomSleepSeconds = getRandomNumber();
        console.log(`[Message]: Starting to sleep for ${randomSleepSeconds} seconds`);
        await sleep(randomSleepSeconds);
        console.log(`[Message]: Finish to sleep for ${randomSleepSeconds} seconds`);
        const {
            url,
            email,
            password,
            MFASecret,
        } = process.env;
        if (!url || !email || !password || !MFASecret) {
            throw new Error('Missing parameters.');
        }
        const browser = await chromium.puppeteer.launch({
            args: [
                ...chromium.args,
                '--lang=en-US',
            ],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: true,
            // headless: false,
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
        const MFAToken = await getMFAToken(MFASecret);
        await page.waitForSelector('#idTxtBx_SAOTCC_OTC', { timeout: 60000 });
        await page.focus('#idTxtBx_SAOTCC_OTC');
        await page.keyboard.type(MFAToken);
        await page.waitForSelector('input[value="Verify"]', { timeout: 60000 });
        await page.waitForSelector('input[value="Verify"]', { timeout: 60000 });
        await page.click('input[value="Verify"]');
        console.log('[Message]: Login successfully.');
        await page.waitForSelector('input[value="Yes"]', { timeout: 60000 });
        await page.click('input[value="Yes"]');
        await page.waitForTimeout(2000);
        const currentTime = moment();
        // const currentTime = moment('2021-05-26 10:00');
        console.log(`[Message]: Current time is ${currentTime.toDate()}`);
        await page.waitForSelector('input[value="正常"]', { timeout: 60000 });
        await page.click('input[value="正常"]');
        console.log('[Message]: 身體狀況選擇 正常');
        await page.waitForTimeout(1000);
        console.log(currentTime.hours());
        if (currentTime.hours() > 2) {
            console.log('[Message]: This is night report.');
            await page.waitForSelector('input[value="晚上下班前填寫"]', { timeout: 60000 });
            await page.click('input[value="晚上下班前填寫"]');
            console.log('[Message]: 本次填寫時段選擇 晚上下班前填寫');
            await page.waitForTimeout(1000);
            await page.waitForSelector('input[value="直接回家不繞路"]', { timeout: 60000 });
            await page.click('input[value="直接回家不繞路"]');
            console.log('[Message]: 今晚預計移動地點選擇 直接回家不繞路');
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
            await page.waitForSelector('input[value="在家工作"]', { timeout: 60000 });
            await page.click('input[value="在家工作"]');
            console.log('[Message]: 工作地點選擇 在家工作');
        } else {
            console.log('[Message]: This is morning report except on Monday.');
            await page.waitForSelector('input[value="早上上班前填寫"]', { timeout: 60000 });
            await page.click('input[value="早上上班前填寫"]');
            console.log('[Message]: 本次填寫時段選擇 早上上班前填寫');
            await page.waitForTimeout(1000);
            await page.waitForSelector('input[value="在家工作"]', { timeout: 60000 });
            await page.click('input[value="在家工作"]');
            console.log('[Message]: 工作地點選擇 在家工作');
        }
        await page.waitForTimeout(1000);
        await page.waitForSelector('input[value="免填"]', { timeout: 60000 });
        await page.click('input[value="免填"]');
        console.log('[Message]: 是否填寫工時表選擇 免填');
        if (currentTime.hours() > 2) {
            await page.waitForTimeout(1000);
            await page.waitForSelector('input[value="否，從未出入該市場"]', { timeout: 60000 });
            await page.click('input[value="否，從未出入該市場"]');
            console.log('[Message]: 曾於6/8~7/1期間至環南市場 否，從未出入該市場');
        }
        await page.waitForTimeout(1000);
        await page.waitForSelector('input[type="checkbox"]', { timeout: 60000 });
        await page.click('input[type="checkbox"]');
        console.log('[Message]: 勾選回條');
        await page.waitForSelector('button[title="Submit"]', { timeout: 60000 });
        await page.click('button[title="Submit"]');
        await browser.close();
        console.log('[Message]: Auto report succeed.');
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};
