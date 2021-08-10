import { Authenticator } from 'otplib/core';
import { keyDecoder, keyEncoder } from '@otplib/plugin-thirty-two';
import { createDigest, createRandomBytes } from '@otplib/plugin-crypto';
import { Browser, Page } from 'puppeteer-core';
import chromium from 'chrome-aws-lambda';
import moment from 'moment';
import log4js, { Logger } from 'log4js';

let logger: Logger;

////////////////////////////////////////////////
// Where will you work today? WFH = ture / false
const is_wfh  = ( "true" == process.env.is_wfh)
const is_test = ( "true" == process.env.is_test)
////////////////////////////////////////////////

const initialLogger = async () => {
    /**
    *   This function is to initial logger
    */
    try {
        logger = log4js.getLogger();
        logger.level = 'info';
        return logger;
    } catch (error) {
        logger.error(error);
        throw new Error('Error while initial logger.');
    }
};
const getRandomNumber = () => Math.ceil(Math.random() * 30);

const sleep = async (_seconds: number) => new Promise((resolve) => setTimeout(
    /** This function is to wait for a period of time */
    () => resolve(true), _seconds * 1000,
));

const initialBrowser = async () => {
    /**
    *   This function is to initial browser
    */
    try {
        const browser = await chromium.puppeteer.launch({
            args: [
                ...chromium.args,
                '--lang=en-US',
            ],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: !is_test,
            ignoreHTTPSErrors: true,
        });
        return browser;
    } catch (error) {
        logger.error(error);
        throw new Error('Error while initial browser.');
    }
};

const initialPage = async (
    _browser: Browser,
    _url: string,
) => {
    /**
    *   This function is to initial page
    */
    try {
        const page = (await _browser.pages())[0] || await _browser.newPage();
        logger.info(`Navigate to ${_url}`);
        await page.goto(_url, { waitUntil: 'networkidle0' });
        logger.info(`Navigate to ${_url} succeed.`);
        return page;
    } catch (error) {
        logger.error(error);
        throw new Error('Error while initial page.');
    }
};

const getMFAToken = async (
    MFASecret: string,
) => {
    /**
    *   This function is to get mfa token
    */
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
        logger.error(error);
        throw new Error('Error while get mfa token.');
    }
};

const processLoginAction = async (
    _page: Page,
    _email: string,
    _password: string,
    _MFASecret: string,
) => {
    /**
    *   This function is to process login action
    */
    try {
        await _page.waitForSelector('#i0116', { timeout: 60000 });
        await _page.focus('#i0116');
        await _page.keyboard.type(_email);
        logger.info(`Logging with username ${_email}`);
        await _page.click('#idSIButton9');
        await _page.waitForTimeout(1000);
        await _page.waitForSelector('#i0118', { timeout: 60000 });
        await _page.focus('#i0118');
        await _page.keyboard.type(_password);
        logger.info(`Logging with password ${'*'.repeat(_password.length)}`);

        if (is_test) {
            await _page.waitForTimeout(2000);
            await _page.waitForSelector('input[value="登入"]', { timeout: 60000 });
            await _page.click('input[value="登入"]');
        }

        else {
            await _page.waitForSelector('input[value="Sign in"]', { timeout: 60000 });
            await _page.click('input[value="Sign in"]');
        }

        const MFAToken = await getMFAToken(_MFASecret);
        await _page.waitForSelector('#idTxtBx_SAOTCC_OTC', { timeout: 60000 });
        await _page.focus('#idTxtBx_SAOTCC_OTC');
        await _page.keyboard.type(MFAToken);
        logger.info(`Verify with mfa token ${MFAToken}`);

        if (is_test) {
            await _page.waitForTimeout(2000);
            await _page.waitForSelector('input[value="驗證"]', { timeout: 60000 });
            await _page.click('input[value="驗證"]');
        }
        
        else {
            await _page.waitForSelector('input[value="Verify"]', { timeout: 60000 });
            await _page.click('input[value="Verify"]');
        }

        await _page.waitForTimeout(1000);
        logger.info('Log in succeed.');

        if (is_test) {
            await _page.waitForTimeout(2000);
            await _page.waitForSelector('input[value="是"]', { timeout: 60000 });
            await _page.click('input[value="是"]');
        }
        
        else {
            await _page.waitForSelector('input[value="Yes"]', { timeout: 60000 });
            await _page.click('input[value="Yes"]');
        }

        await _page.waitForTimeout(2000);
    } catch (error) {
        logger.error(error);
        throw new Error('Error while process login action.');
    }
};

const getCorrentTime = async () => {
    /**
    *   This function is to get current
    */
    try {
        const currentTime = moment();
        // const currentTime = moment('2021-05-26 10:00');
        logger.info(`Current time is ${currentTime.toDate()}`);
        return currentTime;
    } catch (error) {
        logger.error(error);
        throw new Error('Error while get current time.');
    }
};

const processHealthStatusCheck = async (
    _page: Page,
) => {
    try {
        logger.info(`Your WFH mode is ${is_wfh}`);
        await _page.waitForSelector('input[value="正常(Normal)"]', { timeout: 60000 });
        await _page.click('input[value="正常(Normal)"]');
        logger.info('身體狀況選擇 正常(Normal)');
        await _page.waitForTimeout(1000);
    } catch (error) {
        logger.error(error);
        throw new Error('Error while process health status check.');
    }
};

const processOffWorkReport = async (
    _page: Page,
) => {
    /**
    *   This function is to process off work report
    */
    try {
        logger.info('Processing off work report');
        await _page.waitForSelector('input[value="晚上下班前填寫(in the afternoon before punch out)"]', { timeout: 60000 });
        await _page.click('input[value="晚上下班前填寫(in the afternoon before punch out)"]');
        logger.info('本次填寫時段選擇 晚上下班前填寫(in the afternoon before punch out)');
        await _page.waitForTimeout(1000);

        if (is_wfh) {
            await _page.waitForSelector('input[value="在家休息無外出(Stay at home)"]', { timeout: 60000 });
            await _page.click('input[value="在家休息無外出(Stay at home)"]');
            logger.info('今晚預計移動地點選擇 在家休息無外出(Stay at home)');
        }

        else if (is_wfh == false) {
            await _page.waitForSelector('input[value="直接回家不繞路(Back home directly)"]', { timeout: 60000 });
            await _page.click('input[value="直接回家不繞路(Back home directly)"]');
            logger.info('今晚預計移動地點選擇 直接回家不繞路(Back home directly)');
        }

        else {
            logger.info('Work mode error, please check your code.');
        }

        await _page.waitForTimeout(1000);
        await _page.waitForSelector('input[value="否 No"]', { timeout: 60000 });
        await _page.click('input[value="否 No"]');
        logger.info('是否填寫工時表選擇 否 No');

    } catch (error) {
        logger.error(error);
        throw new Error('Error while process off work report.');
    }
};

const processBeforeWorkReportAfterHoliday = async (
    _page: Page,
) => {
    /**
    *   This function is to process before work report after holiday
    */
    try {
        logger.info('Processing before work report after holiday');
        await _page.waitForSelector('input[value="假日後上班(週一早上請選此項) (after break)(Monday or after holiday)"]', { timeout: 60000 });
        await _page.click('input[value="假日後上班(週一早上請選此項) (after break)(Monday or after holiday)"]');
        logger.info('本次填寫時段選擇 假日後上班(週一早上請選此項) (after break)(Monday or after holiday)');
        await _page.waitForTimeout(1000);
        await _page.waitForSelector('input[value="在家休息無外出 (Stayed at home)"]', { timeout: 60000 });
        await _page.click('input[value="在家休息無外出 (Stayed at home)"]');
        logger.info('假日活動地點選擇 在家休息無外出 (Stayed at home)');
        await _page.waitForTimeout(1000);

        if (is_wfh) {
            await _page.waitForSelector('input[value="在家工作(WFH)"]', { timeout: 60000 });
            await _page.click('input[value="在家工作(WFH)"]');
            logger.info('工作地點選擇 在家工作(WFH)');
        }
        
        else if (is_wfh == false) {
            await _page.waitForSelector('input[value="ECV辦公室(ECV Office)"]', { timeout: 60000 });
            await _page.click('input[value="ECV辦公室(ECV Office)"]');
            logger.info('工作地點選擇 ECV辦公室(ECV Office)');
        }

        else {
            logger.info('Work mode error, please check your code.');
        }

        await _page.waitForTimeout(1000);
        await _page.waitForSelector('input[value="是Yes"]', { timeout: 60000 });
        await _page.click('input[value="是Yes"]');
        logger.info('是否填寫工時表選擇 是Yes');

    } catch (error) {
        logger.error(error);
        throw new Error('Error while process before work report after holiday.');
    }
};

const processBeforeWorkReport = async (
    _page: Page,
) => {
    /**
    *   This function is to process before work report
    */
    try {
        logger.info('Processing before work report');
        await _page.waitForSelector('input[value="早上上班前填寫( in the morning before punch in)"]', { timeout: 60000 });
        await _page.click('input[value="早上上班前填寫( in the morning before punch in)"]');
        logger.info('本次填寫時段選擇 早上上班前填寫( in the morning before punch in)');
        await _page.waitForTimeout(1000);

        if (is_wfh) {
            await _page.waitForSelector('input[value="在家工作(WFH)"]', { timeout: 60000 });
            await _page.click('input[value="在家工作(WFH)"]');
            logger.info('工作地點選擇 在家工作(WFH)');
        }
        
        else if (is_wfh == false) {
            await _page.waitForSelector('input[value="ECV辦公室(ECV Office)"]', { timeout: 60000 });
            await _page.click('input[value="ECV辦公室(ECV Office)"]');
            logger.info('工作地點選擇 ECV辦公室(ECV Office)');
        }

        else {
            logger.info('Work mode error, please check your code.');
        }

        await _page.waitForTimeout(1000);
        await _page.waitForSelector('input[value="是Yes"]', { timeout: 60000 });
        await _page.click('input[value="是Yes"]');
        logger.info('是否填寫工時表選擇 是Yes');

    } catch (error) {
        logger.error(error);
        throw new Error('Error while process before work report.');
    }
};

// const processTimesheetReport = async (
//     _page: Page,
// ) => {
//     /**
//     *   This function is to process timesheet report
//     */
//     try {
//         await _page.waitForTimeout(1000);
//         await _page.waitForSelector('input[value="免填"]', { timeout: 60000 });
//         await _page.click('input[value="免填"]');
//         logger.info('是否填寫工時表選擇 免填');
//     } catch (error) {
//         logger.error(error);
//         throw new Error('Error while process timesheet report.');
//     }
// };

// const processSpecialReport = async (
//     _page: Page,
// ) => {
//     /**
//     *   This function is to process special report
//     */
//     try {

//         await _page.waitForTimeout(1000);
//         await _page.waitForSelector('input[value="否NO"]', { timeout: 60000 });
//         await _page.click('input[value="否NO"]');
//         logger.info('在近兩周內是否有與確診者或是被匡列人士接觸選擇 否NO');

//         await _page.waitForTimeout(1000);
//         await _page.waitForSelector('input[value="否NO"]', { timeout: 60000 });
//         await _page.click('input[value="否NO"]');
//         logger.info('在近兩周內是否有與發燒或是身體不適患者接觸選擇 否NO');

//     } catch (error) {
//         logger.error(error);
//         throw new Error('Error while process special report.');
//     }
// };

const processCheckReply = async (
    _page: Page,
) => {
    /**
    *   This function is to process check reply
    */
    try {
        await _page.waitForTimeout(1000);
        await _page.waitForSelector('input[type="checkbox"]', { timeout: 60000 });
        await _page.click('input[type="checkbox"]');
        logger.info('勾選回條');
    } catch (error) {
        logger.error(error);
        throw new Error('Error while process check reply.');
    }
};

const processSubmitReport = async (
    _page: Page,
) => {
    /**
    *   This function is to process submit report
    */
    try {
        await _page.waitForTimeout(1000);
        await _page.waitForSelector('button[title="Submit"]', { timeout: 60000 });
        await _page.click('button[title="Submit"]');
        logger.info('提交回應');
    } catch (error) {
        logger.error(error);
        throw new Error('Error while process submit report.');
    }
};

// eslint-disable-next-line import/prefer-default-export
export const autoReport = async () => {
    /**
    *   This function is to process auto report
    */
    try {
        initialLogger();
        const randomSleepSeconds = getRandomNumber();
        logger.info(`Starting to sleep for ${randomSleepSeconds} seconds`);
        await sleep(randomSleepSeconds);
        logger.info(`Finish to sleep for ${randomSleepSeconds} seconds`);
        logger.info(`Your test mode is ${is_test}`);
        const {
            url,
            email,
            password,
            MFASecret,
        } = process.env;
        if (!url || !email || !password || !MFASecret) {
            throw new Error('Missing parameters.');
        }
        const browser = await initialBrowser();
        const page = await initialPage(
            browser,
            url,
        );
        processLoginAction(
            page,
            email,
            password,
            MFASecret,
        );
        const currentTime = await getCorrentTime();
        await processHealthStatusCheck(
            page,
        );
        if (currentTime.hours() > 2) {
            await processOffWorkReport(
                page,
            );
        } else if (currentTime.day() === 1) {
            await processBeforeWorkReportAfterHoliday(
                page,
            );
        } else {
            await processBeforeWorkReport(
                page,
            );
        }
        // await processTimesheetReport(
        //     page,
        // );
        // await processSpecialReport(
        //     page,
        // );
        await processCheckReply(
            page,
        );
        if (is_test) {
            // await processSubmitReport(
            //     page,
            // );
            logger.info('Skip process submit report');
        }
        else {
            await processSubmitReport(
                page,
            );
        }
        await browser.close();
        logger.info('Auto report succeed');
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};
