const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
require('dotenv').config();

async function loginTwitter(driver) {
    try {
        await driver.get('https://twitter.com/login');

        const usernameInput = await driver.wait(until.elementLocated(By.xpath('//*[@id="react-root"]/div/div/div/main/div/div/div/div[2]/div[2]/div/div[5]/label/div/div[2]/div/input')), 10000);
        await usernameInput.sendKeys(process.env.USER_NAME);

        const nextButton = await driver.findElement(By.xpath('//*[@id="react-root"]/div/div/div/main/div/div/div/div[2]/div[2]/div/div[6]'));
        await nextButton.click();

        const passwordInput = await driver.wait(until.elementLocated(By.xpath('//*[@id="react-root"]/div/div/div/main/div/div/div/div[2]/div[2]/div[1]/div/div/div/div[3]/div/label/div/div[2]/div[1]/input')), 10000);
        await passwordInput.sendKeys(process.env.PASSWORD);

        const loginButton = await driver.findElement(By.xpath('//div[@data-testid="LoginForm_Login_Button"]'));
        await loginButton.click();

        await driver.wait(until.urlContains('twitter.com/home'), 10000);
    } catch (e) {
        console.error(e, "error detected");
    }
}

async function postComment(driver, newTweet) {
    try {
        const replyButton = await driver.wait(until.elementLocated(By.xpath("//div[@data-testid='reply']")), 10000);
        await replyButton.click();

        const textArea = await driver.wait(until.elementLocated(By.xpath("//div[@data-testid='tweetTextarea_0']")), 10000);
        await textArea.sendKeys(newTweet);

        const replyPostButton = await driver.wait(until.elementLocated(By.xpath("//div[@data-testid='tweetButton']")), 10000);
        await replyPostButton.click();

        console.log('Comment posted successfully');
    } catch (err) {
        console.error(`POST COMMENT ERROR: ${err}`);
    }
}

async function monitorTweets() {
    let options = new chrome.Options();
    options.windowSize({ width: 700, height: 812 });
    // options.headless();

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        await loginTwitter(driver);

        let lastTweet = await getLatestTweet(driver);

        while (true) {
            try {
                await driver.navigate().refresh();
                let newTweet = await getLatestTweet(driver);

                if (newTweet !== lastTweet) {
                    console.log(`NEW TWEET DETECTED`);
                    lastTweet = newTweet;
                } else {
                    console.log(`NO NEW TWEET`);
                }

                await postComment(driver, newTweet);

                let tweetElements = await driver.findElements(By.xpath("//*[@data-testid='tweetText']"));
                for (let i = 0; i < tweetElements.length; i++) {
                    try {
                        tweetElements = await driver.findElements(By.xpath("//*[@data-testid='tweetText']"));
                        if (tweetElements[i]) {
                            await tweetElements[i].click();
                            await driver.sleep(5000);
                            await driver.navigate().back();
                            await driver.sleep(5000);
                        }
                    } catch (err) {
                        console.error(`ERROR CLICKING TWEET: ${err}`);
                        tweetElements = await driver.findElements(By.xpath("//*[@data-testid='tweetText']"));
                    }
                }
            } catch (err) {
                console.error(`LOOP ERROR: ${err}`);
            }
            await driver.sleep(5000);
        }
    } catch (err) {
        console.error(`MAIN ERROR: ${err}`);
    } finally {
        await driver.quit();
    }
}

async function getLatestTweet(driver) {
    try {
        const tweets = await driver.wait(until.elementsLocated(By.xpath("//*[@data-testid='tweetText']")), 60000);
        const tweetsCaption = [];
        for (let tweet of tweets) {
            const text = await tweet.getText();
            tweetsCaption.push(text);
        }
        const randomTweetCaption = tweetsCaption[Math.floor(Math.random() * tweetsCaption.length)];
        console.log(`Randomly selected tweet: ${randomTweetCaption}`);
        return randomTweetCaption;
    } catch (err) {
        console.error(`GET LATEST TWEET ERROR: ${err}`);
        return null;
    }
}

(async () => {
    await monitorTweets();
})();