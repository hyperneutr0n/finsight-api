const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const { formatDistanceToNow } = require("date-fns");
const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

const stockCodes = [
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "META",
  "TSLA",
  "NVDA",
  "JPM",
  "JNJ",
  "PG",
  "^GSPC",
  "BTC-USD",
  "GC=F",
  "XOM",
  "CVX",
  "PFE",
  "MRNA",
  "KO",
  "PEP",
  "F",
  "GM",
  "DIS",
  "NKE",
  "V",
  "MA",
  "SPY",
  "QQQ",
];

const processNewsPageWithPuppeteer = async (newsUrl) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true, // Pastikan berjalan tanpa GUI
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // Tambahan untuk kompatibilitas
    });
    const page = await browser.newPage();

    // Set user agent untuk menghindari penolakan
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    // Tambahkan timeout yang lebih panjang
    await page.setDefaultNavigationTimeout(60000); // 60 detik

    await page.goto(newsUrl, {
      waitUntil: "networkidle0", // Tunggu sampai network hampir kosong
      timeout: 60000,
    });

    // Tunggu elemen kunci dimuat
    await page.waitForSelector("h1.cover-title", { timeout: 30000 });

    const content = await page.evaluate(() => {
      const title =
        document.querySelector("h1.cover-title")?.innerText.trim() ||
        "No Title";

      // Untuk video, coba ambil deskripsi/teks
      const paragraphs = Array.from(document.querySelectorAll("p"))
        .map((p) => p.innerText.trim())
        .join(" ");

      const publisherAuthor =
        document.querySelector("div.byline-attr-author")?.innerText.trim() ||
        "Unknown";
      const percentageChange =
        document
          .querySelector("fin-streamer.percentChange")
          ?.innerText.trim() || "N/A";

      const dateElement = document.querySelector("time.byline-attr-meta-time");
      const dateAttr = dateElement?.getAttribute("datetime") || null;
      const dateText = dateElement?.innerText.trim() || "Unknown";
      const date = dateAttr ? new Date(dateAttr) : null;

      // Coba ambil deskripsi video jika ada
      const videoDescription =
        document.querySelector(".video-description")?.innerText.trim() ||
        paragraphs;

      return {
        title,
        content: videoDescription || paragraphs,
        publisherAuthor,
        percentageChange,
        dateAttr,
        dateText,
        timeAgo: date
          ? formatDistanceToNow(date, { addSuffix: true })
          : "Unknown",
        isVideoPage: true, // Tambahkan flag untuk identifikasi
      };
    });

    await browser.close();
    return content;
  } catch (error) {
    if (browser) await browser.close();
    console.error("Error processing video page:", error.message);
    return null;
  }
};

const processNewsPageWithSelenium = async (newsUrl) => {
  let driver;
  try {
    // Konfigurasi Chrome Options
    const options = new chrome.Options();
    options.addArguments("--headless");
    options.addArguments("--no-sandbox");
    options.addArguments("--disable-dev-shm-usage");
    options.addArguments("--mute-audio");
    options.addArguments("--disable-gpu");
    options.addArguments("start-maximized");
    options.addArguments("disable-infobars");
    options.addArguments("--disable-extensions");

    // Tambahkan opsi untuk mengatasi blocking
    options.addArguments("--disable-web-security");
    options.addArguments("--ignore-certificate-errors");

    // Inisialisasi WebDriver dengan timeout global
    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    // Set timeout global
    await driver.manage().setTimeouts({
      implicit: 10000, // Waktu tunggu implicit 10 detik
      pageLoad: 30000, // Timeout page load 30 detik
      script: 30000, // Timeout script 30 detik
    });

    console.log(`Navigating to: ${newsUrl}`); // Log URL yang dicrawl

    // Navigate dengan timeout dan error handling
    try {
      await driver.get(newsUrl);
    } catch (navError) {
      console.error(`Navigation error: ${navError.message}`);
      return null;
    }

    // Tunggu dengan explicit wait dan fallback
    try {
      await driver.wait(
        until.elementLocated(By.css("h1.cover-title")),
        20000,
        "Timeout menunggu judul"
      );
    } catch (waitError) {
      console.error(`Wait error: ${waitError.message}`);

      // Cek apakah halaman sudah dimuat
      const pageSource = await driver.getPageSource();
      console.log("Page source length:", pageSource.length);

      // Coba alternatif selector
      const alternativeSelectors = ["h1", ".title", ".headline", "article h1"];

      for (let selector of alternativeSelectors) {
        try {
          const element = await driver.findElement(By.css(selector));
          const title = await element.getText();
          console.log(`Found alternative title with selector: ${selector}`);

          return {
            title,
            content: "Unable to extract full content",
            publisherAuthor: "Unknown",
            percentageChange: "N/A",
            dateText: "Unknown",
            timeAgo: "Unable to calculate",
            isVideoPage: true,
          };
        } catch {}
      }

      return null;
    }

    // Fungsi untuk safely ekstrak teks
    const safeGetText = async (locator, defaultValue = "Unknown") => {
      try {
        const element = await driver.findElement(locator);
        return await element.getText();
      } catch {
        return defaultValue;
      }
    };

    // Ekstrak informasi dengan error handling
    const title = await safeGetText(By.css("h1.cover-title"));

    // Cari paragraf dengan fallback
    let content = [];
    try {
      const paragraphs = await driver.findElements(By.css("p"));
      content = await Promise.all(paragraphs.map((p) => p.getText()));
    } catch {
      content = ["Unable to extract paragraphs"];
    }

    // Ekstrak informasi tambahan dengan safety
    const publisherAuthor = await safeGetText(By.css("div.byline-attr-author"));
    const dateText = await safeGetText(By.css("time.byline-attr-meta-time"));
    const percentageChange = await safeGetText(
      By.css("fin-streamer.percentChange")
    );

    return {
      title,
      content: content.join(" "),
      publisherAuthor,
      percentageChange,
      dateText,
      timeAgo: "Unable to calculate",
      isVideoPage: true,
    };
  } catch (error) {
    console.error(
      `Comprehensive error processing video page (${newsUrl}):`,
      error
    );

    // Log detail error
    if (error.name === "TimeoutError") {
      console.error("Timeout occurred");
    }

    return null;
  } finally {
    // Pastikan driver ditutup dengan aman
    try {
      if (driver) {
        await driver.quit();
      }
    } catch (quitError) {
      console.error("Error quitting driver:", quitError);
    }
  }
};

const processNewsPage = async (newsUrl) => {
  try {
    const response = await axios.get(newsUrl);
    const $ = cheerio.load(response.data);

    const convertToNanoseconds = (dateString) => {
      const date = new Date(dateString); // Parse ISO 8601 to Date object
      const milliseconds = date.getTime(); // Get timestamp in milliseconds
      return BigInt(milliseconds) * 1_000_000n; // Convert to nanoseconds
    };

    const code = $("div.name").text().trim();
    const title = $("h1.cover-title").text().trim();
    const content = $("p")
      .map((i, el) => $(el).text().trim())
      .get()
      .join(" ");
    const publisherAuthor = $("div.byline-attr-author").text().trim();
    const percentageChange = $("fin-streamer.percentChange").text().trim();
    const dateAttr = $("time.byline-attr-meta-time").attr("datetime");
    const date = dateAttr ? new Date(dateAttr) : null;
    const nanoSeconds = convertToNanoseconds(date);

    return {
      code,
      title,
      content,
      publisherAuthor,
      percentageChange,
      nanoSeconds,
      dateAttr,
      dateText: $("time.byline-attr-meta-time").text(),
      timeAgo: date
        ? formatDistanceToNow(date, { addSuffix: true })
        : "Unknown",
    };
  } catch (error) {
    console.error("Error processing news page:", error.message);
    return null;
  }
};

exports.news = async (req, res) => {
  try {
    let allNewsContent = {};

    await Promise.all(
      stockCodes.map(async (stockCode) => {
        const url = `https://finance.yahoo.com/quote/${stockCode}/`;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const uniqueNewsUrls = new Set();

        $("div.stream-item.yf-186c5b2 a.subtle-link").each((index, element) => {
          const href = $(element).attr("href");
          if (href) {
            const fullUrl = href.startsWith("http")
              ? href
              : `https://finance.yahoo.com${href}`;
            uniqueNewsUrls.add(fullUrl);
          }
        });

        const limitedNewsUrls = Array.from(uniqueNewsUrls).slice(0, 5);
        const newsContents = await Promise.all(
          limitedNewsUrls.map(async (newsUrl) => {
            console.log("Fetching URL:", newsUrl);
            return await processNewsPage(newsUrl);
          })
        );

        allNewsContent[stockCode] = newsContents.filter(Boolean);
      })
    );
    for (const key in allNewsContent) {
      if (Array.isArray(allNewsContent[key])) {
        // Filter out objects with empty "code"
        allNewsContent[key] = allNewsContent[key].filter(
          (item) => item.code && item.code.trim() !== ""
        );
      }
    }
    // Convert BigInt to string for serialization
    const response = JSON.parse(
      JSON.stringify(allNewsContent, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
    return res.status(200).json({
      status: "success",
      message: "Crawling and news extraction completed!",
      allNewsContent: response,
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      error: error.message,
    });
  }
};
