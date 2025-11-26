const { chromium } = require('playwright');

async function debugPage() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('https://www.rightmove.co.uk/property-for-sale/find.html?searchLocation=Manchester%2C+Greater+Manchester&useLocationIdentifier=true&locationIdentifier=REGION%5E904&radius=0.0&maxPrice=300000&maxBedrooms=3&_includeSSTC=on&propertyTypes=semi-detached&sortType=2&channel=BUY&transactionType=BUY&displayLocationIdentifier=Manchester&dontShow=sharedOwnership%2Cretirement');
  
  await page.waitForLoadState('networkidle');
  
  // Check for PAGE_MODEL
  const pageModel = await page.evaluate(() => {
    return {
      hasPageModel: typeof window.PAGE_MODEL !== 'undefined',
      hasNextData: typeof window.__NEXT_DATA__ !== 'undefined',
      pageModelKeys: typeof window.PAGE_MODEL !== 'undefined' ? Object.keys(window.PAGE_MODEL) : [],
      nextDataKeys: typeof window.__NEXT_DATA__ !== 'undefined' ? Object.keys(window.__NEXT_DATA__) : []
    };
  });
  
  console.log('JavaScript Data Objects:', JSON.stringify(pageModel, null, 2));
  
  // Check for property cards
  const propertyInfo = await page.evaluate(() => {
    const selectors = [
      '.propertyCard',
      '[data-test="property-card"]',
      '[class*="property"]',
      '[class*="Property"]',
      '[id*="property"]',
      'article',
      '[data-testid]'
    ];
    
    const results = {};
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        results[selector] = {
          count: elements.length,
          firstElementClasses: elements[0].className,
          firstElementId: elements[0].id,
          firstElementTag: elements[0].tagName
        };
      }
    });
    
    return results;
  });
  
  console.log('\nProperty Card Selectors:', JSON.stringify(propertyInfo, null, 2));
  
  // Get a sample of the HTML
  const bodyHTML = await page.evaluate(() => {
    return document.body.innerHTML.substring(0, 5000);
  });
  
  console.log('\nHTML Sample (first 5000 chars):\n', bodyHTML);
  
  await page.screenshot({ path: 'rightmove-page.png', fullPage: true });
  console.log('\nScreenshot saved to rightmove-page.png');
  
  await browser.close();
}

debugPage().catch(console.error);
