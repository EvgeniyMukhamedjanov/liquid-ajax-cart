const puppeteer = require('puppeteer');
const fs = require('node:fs');
const yaml = require('js-yaml');
const resizeImg = require('resize-img');

const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function captureScreenshots() {
  try {
    const data = fs.readFileSync('docs/_config.yml', 'utf8');
    const parsedData = yaml.load(data);
    const browser = await puppeteer.launch({
      executablePath,
      headless: 'new'
    });
    const page = await browser.newPage();
    await page.setViewport({
      width: 1540,
      height: 771,
    });

    for (const {image, url, selector, autoscreenshot} of parsedData.links.portfolio) {
      if (autoscreenshot === 'no') continue;
      await page.goto(url, {
        timeout: 0
      });

      await new Promise(r => setTimeout(r, 2000)); //waiting for the page to load completely
      if (selector) {
        const selectorArr = await selector.split(',');
        for (const item of selectorArr) {
          if (await page.$(item)) {
            const element = await page.waitForSelector(item);
            await element.click();
            console.log(`✅ Clicked to '${item}' selector to hide it (${url})`);
          } else console.log(`❌ Selector '${item}' isn't found (${url})`);
        }
        await new Promise(r => setTimeout(r, 1000)); //waiting for the popup to close completely
      }
      await page.screenshot({path: `docs/assets/screens/${image}`});
      console.log(`✅ Screenshot captured ${url} - ${image}`);

      const resizeImage = await resizeImg(fs.readFileSync(`docs/assets/screens/${image}`), {
        width: 527,
        height: 264
      });
      fs.writeFileSync(`docs/assets/screens/${image}`, resizeImage);
      console.log(`✅ Screenshot size was changed to 527x264 (${image})`);
      console.log('-------------------------------------------------------------------');
    }

    await browser.close();
  } catch (err) {
    console.log("❌ Error: ", err.message);
  }
}

captureScreenshots();