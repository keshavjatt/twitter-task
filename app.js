const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
require('dotenv').config();

async function monitorTweets() {
    let options = new chrome.Options();
    options.addArguments('--window-size=700,700');

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        await loginTwitter(driver);

        await clickOnExistingTweets(driver);

        let lastTweet = await getLatestTweet(driver);

        while (true) {
            try {
                await driver.navigate().refresh();
                let newTweet = await getLatestTweet(driver);

                if (newTweet !== lastTweet) {
                    console.log(`NEW TWEET DETECTED: ${newTweet}`);
                    await clickLatestTweet(driver);
                    console.log("Clicked on the latest tweet.");
                    lastTweet = newTweet;

                    await driver.sleep(5000);
                    await driver.get('https://twitter.com/home');
                } else {
                    console.log(`NO NEW TWEET`);
                }
            } catch (err) {
                console.error(`ERROR: ${err}`);
            }
            await driver.sleep(20000);
        }
    } catch (err) {
        console.error(`MAIN ERROR: ${err}`);
    } finally {
        await driver.quit();
    }
}

async function loginTwitter(driver) {
    await driver.get('https://twitter.com/login');
    const usernameInput = await driver.wait(until.elementLocated(By.xpath('//*[@id="react-root"]/div/div/div/main/div/div/div/div[2]/div[2]/div/div[5]/label/div/div[2]/div/input')), 100000);
    await usernameInput.sendKeys(process.env.USER_NAME);

    const passwordInput = await driver.wait(until.elementLocated(By.xpath('//*[@id="react-root"]/div/div/div/main/div/div/div/div[2]/div[2]/div[1]/div/div/div/div[3]/div/label/div/div[2]/div[1]/input')), 10000);
    await passwordInput.sendKeys(process.env.PASSWORD);

    const loginButton = await driver.findElement(By.xpath('//div[@data-testid="LoginForm_Login_Button"]'));
    await loginButton.click();

    await driver.wait(until.urlContains('twitter.com/home'), 10000);
}

async function clickOnExistingTweets(driver) {
    const tweetElements = await driver.findElements(By.xpath("//div[@data-testid='tweetText']"));

    for (const tweetElement of tweetElements) {
        await tweetElement.click();
        console.log("Clicked on an existing tweet.");
        await driver.sleep(3000);
    }
}

async function getLatestTweet(driver) {
    const tweetElement = await driver.wait(until.elementLocated(By.xpath("//div[@data-testid='tweetText']")), 20000);
    return await tweetElement.getText();
}

async function clickLatestTweet(driver) {
    const tweetElement = await driver.wait(until.elementLocated(By.xpath("//div[@data-testid='tweetText']")), 20000);
    await tweetElement.click();
}

monitorTweets();