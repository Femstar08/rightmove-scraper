/**
 * Tests for DOM fallback extraction functionality
 * Validates Requirements 3.7, 4.10
 */

const { extractFromDOM } = require('./main');

describe('DOM Fallback Extraction', () => {
  describe('extractFromDOM', () => {
    test('should extract properties from DOM when JavaScript data unavailable', async () => {
      // Mock Playwright page with HTML content
      const mockPage = {
        content: jest.fn().mockResolvedValue(`
          <html>
            <body>
              <div class="propertyCard">
                <a class="propertyCard-link" href="/properties/123456">View Property</a>
                <div class="propertyCard-address">123 Test Street, London</div>
                <div class="propertyCard-priceValue">£350,000</div>
                <div class="propertyCard-description">Beautiful property with garden</div>
                <div class="propertyCard-contactsItem">Added today</div>
                <img class="propertyCard-img" src="/images/property1.jpg" />
              </div>
              <div class="propertyCard">
                <a class="propertyCard-link" href="/properties/789012">View Property</a>
                <div class="propertyCard-address">456 Sample Road, Manchester</div>
                <div class="propertyCard-priceValue">£275,000</div>
                <div class="propertyCard-description">Spacious home</div>
                <div class="propertyCard-contactsItem">Added yesterday</div>
                <img class="propertyCard-img" src="/images/property2.jpg" />
              </div>
            </body>
          </html>
        `)
      };

      const distressKeywords = ['reduced', 'chain free'];
      const properties = await extractFromDOM(mockPage, distressKeywords);

      expect(properties).toHaveLength(2);
      
      // Verify first property
      expect(properties[0]).toEqual({
        url: 'https://www.rightmove.co.uk/properties/123456',
        address: '123 Test Street, London',
        price: '£350,000',
        description: 'Beautiful property with garden',
        addedOn: 'Added today',
        image: 'https://www.rightmove.co.uk/images/property1.jpg',
        distressKeywordsMatched: [],
        distressScoreRule: 0
      });

      // Verify second property
      expect(properties[1]).toEqual({
        url: 'https://www.rightmove.co.uk/properties/789012',
        address: '456 Sample Road, Manchester',
        price: '£275,000',
        description: 'Spacious home',
        addedOn: 'Added yesterday',
        image: 'https://www.rightmove.co.uk/images/property2.jpg',
        distressKeywordsMatched: [],
        distressScoreRule: 0
      });
    });

    test('should return empty array when no property cards found in DOM', async () => {
      const mockPage = {
        content: jest.fn().mockResolvedValue(`
          <html>
            <body>
              <div class="container">
                <p>No properties found</p>
              </div>
            </body>
          </html>
        `)
      };

      const properties = await extractFromDOM(mockPage, []);
      expect(properties).toEqual([]);
    });

    test('should handle missing fields gracefully with null values', async () => {
      const mockPage = {
        content: jest.fn().mockResolvedValue(`
          <html>
            <body>
              <div class="propertyCard">
                <a class="propertyCard-link" href="/properties/123">View</a>
                <!-- Missing address, price, description, addedOn, image -->
              </div>
            </body>
          </html>
        `)
      };

      const properties = await extractFromDOM(mockPage, []);
      
      expect(properties).toHaveLength(1);
      expect(properties[0]).toEqual({
        url: 'https://www.rightmove.co.uk/properties/123',
        address: null,
        price: null,
        description: null,
        addedOn: null,
        image: null,
        distressKeywordsMatched: [],
        distressScoreRule: 0
      });
    });

    test('should detect distress keywords in DOM-extracted descriptions', async () => {
      const mockPage = {
        content: jest.fn().mockResolvedValue(`
          <html>
            <body>
              <div class="propertyCard">
                <a class="propertyCard-link" href="/properties/123">View</a>
                <div class="propertyCard-address">Test Address</div>
                <div class="propertyCard-priceValue">£300,000</div>
                <div class="propertyCard-description">REDUCED price, chain free property</div>
                <div class="propertyCard-contactsItem">Added today</div>
                <img class="propertyCard-img" src="/img.jpg" />
              </div>
            </body>
          </html>
        `)
      };

      const distressKeywords = ['reduced', 'chain free', 'auction'];
      const properties = await extractFromDOM(mockPage, distressKeywords);
      
      expect(properties).toHaveLength(1);
      expect(properties[0].distressKeywordsMatched).toEqual(['reduced', 'chain free']);
      expect(properties[0].distressScoreRule).toBe(4); // 2 keywords * 2 = 4
    });

    test('should handle extraction errors gracefully', async () => {
      const mockPage = {
        content: jest.fn().mockRejectedValue(new Error('Page content error'))
      };

      const properties = await extractFromDOM(mockPage, []);
      expect(properties).toEqual([]);
    });

    test('should extract multiple properties from DOM', async () => {
      const mockPage = {
        content: jest.fn().mockResolvedValue(`
          <html>
            <body>
              <div class="propertyCard">
                <a class="propertyCard-link" href="/properties/1">Property 1</a>
                <div class="propertyCard-address">Address 1</div>
                <div class="propertyCard-priceValue">£100,000</div>
                <div class="propertyCard-description">Description 1</div>
                <div class="propertyCard-contactsItem">Added 1 day ago</div>
                <img class="propertyCard-img" src="/img1.jpg" />
              </div>
              <div class="propertyCard">
                <a class="propertyCard-link" href="/properties/2">Property 2</a>
                <div class="propertyCard-address">Address 2</div>
                <div class="propertyCard-priceValue">£200,000</div>
                <div class="propertyCard-description">Description 2</div>
                <div class="propertyCard-contactsItem">Added 2 days ago</div>
                <img class="propertyCard-img" src="/img2.jpg" />
              </div>
              <div class="propertyCard">
                <a class="propertyCard-link" href="/properties/3">Property 3</a>
                <div class="propertyCard-address">Address 3</div>
                <div class="propertyCard-priceValue">£300,000</div>
                <div class="propertyCard-description">Description 3</div>
                <div class="propertyCard-contactsItem">Added 3 days ago</div>
                <img class="propertyCard-img" src="/img3.jpg" />
              </div>
            </body>
          </html>
        `)
      };

      const properties = await extractFromDOM(mockPage, []);
      expect(properties).toHaveLength(3);
      
      // Verify all properties have required fields
      properties.forEach((property, index) => {
        expect(property).toHaveProperty('url');
        expect(property).toHaveProperty('address');
        expect(property).toHaveProperty('price');
        expect(property).toHaveProperty('description');
        expect(property).toHaveProperty('addedOn');
        expect(property).toHaveProperty('image');
        expect(property).toHaveProperty('distressKeywordsMatched');
        expect(property).toHaveProperty('distressScoreRule');
      });
    });
  });
});
