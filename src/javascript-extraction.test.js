const {
  extractPageModel,
  extractFromPageModel,
  extractPropertyFromJS
} = require('./main');

describe('JavaScript Data Extraction', () => {
  describe('extractPropertyFromJS', () => {
    test('should extract all property fields from JavaScript object', () => {
      const jsData = {
        id: '123456',
        propertyUrl: '/properties/123456',
        displayAddress: '123 Test Street, London',
        price: {
          displayPrice: '£500,000'
        },
        summary: 'Beautiful property with garden',
        bedrooms: 3,
        bathrooms: 2,
        propertyType: 'Semi-Detached',
        propertyImages: [
          { url: 'https://example.com/image1.jpg' },
          { url: 'https://example.com/image2.jpg' }
        ],
        addedOn: '2025-11-20'
      };

      const result = extractPropertyFromJS(jsData, ['garden', 'beautiful']);

      expect(result).toEqual({
        id: '123456',
        url: 'https://www.rightmove.co.uk/properties/123456',
        address: '123 Test Street, London',
        price: '£500,000',
        description: 'Beautiful property with garden',
        bedrooms: 3,
        bathrooms: 2,
        propertyType: 'Semi-Detached',
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        addedOn: '2025-11-20',
        distressKeywordsMatched: ['garden', 'beautiful'],
        distressScoreRule: 4
      });
    });

    test('should handle missing fields with null values', () => {
      const jsData = {
        id: '789',
        displayAddress: 'Test Address'
      };

      const result = extractPropertyFromJS(jsData, []);

      expect(result.id).toBe('789');
      expect(result.address).toBe('Test Address');
      expect(result.price).toBeNull();
      expect(result.description).toBeNull();
      expect(result.bedrooms).toBeNull();
      expect(result.bathrooms).toBeNull();
      expect(result.propertyType).toBeNull();
      expect(result.images).toEqual([]);
      expect(result.addedOn).toBeNull();
      expect(result.distressKeywordsMatched).toEqual([]);
      expect(result.distressScoreRule).toBe(0);
    });

    test('should handle nested price structure', () => {
      const jsData = {
        id: '456',
        price: {
          amount: 350000,
          displayPrice: '£350,000'
        }
      };

      const result = extractPropertyFromJS(jsData, []);

      expect(result.price).toBe('£350,000');
    });

    test('should handle nested address structure', () => {
      const jsData = {
        id: '789',
        address: {
          displayAddress: 'Nested Address Street'
        }
      };

      const result = extractPropertyFromJS(jsData, []);

      expect(result.address).toBe('Nested Address Street');
    });

    test('should extract images from various formats', () => {
      const jsData1 = {
        id: '1',
        propertyImages: ['img1.jpg', 'img2.jpg']
      };

      const jsData2 = {
        id: '2',
        images: [
          { url: 'img3.jpg' },
          { srcUrl: 'img4.jpg' }
        ]
      };

      const jsData3 = {
        id: '3',
        mainImage: 'main.jpg'
      };

      const result1 = extractPropertyFromJS(jsData1, []);
      const result2 = extractPropertyFromJS(jsData2, []);
      const result3 = extractPropertyFromJS(jsData3, []);

      expect(result1.images).toEqual(['img1.jpg', 'img2.jpg']);
      expect(result2.images).toEqual(['img3.jpg', 'img4.jpg']);
      expect(result3.images).toEqual(['main.jpg']);
    });

    test('should construct URL from ID if propertyUrl missing', () => {
      const jsData = {
        id: '999'
      };

      const result = extractPropertyFromJS(jsData, []);

      expect(result.url).toBe('https://www.rightmove.co.uk/properties/999');
    });

    test('should handle propertyUrl with relative path', () => {
      const jsData = {
        id: '888',
        propertyUrl: '/properties/888'
      };

      const result = extractPropertyFromJS(jsData, []);

      expect(result.url).toBe('https://www.rightmove.co.uk/properties/888');
    });

    test('should handle propertyUrl with absolute path', () => {
      const jsData = {
        id: '777',
        propertyUrl: 'https://www.rightmove.co.uk/properties/777'
      };

      const result = extractPropertyFromJS(jsData, []);

      expect(result.url).toBe('https://www.rightmove.co.uk/properties/777');
    });
  });

  describe('extractFromPageModel', () => {
    test('should extract properties from propertyData array', () => {
      const pageModel = {
        propertyData: [
          {
            id: '1',
            displayAddress: 'Address 1',
            price: { displayPrice: '£100,000' }
          },
          {
            id: '2',
            displayAddress: 'Address 2',
            price: { displayPrice: '£200,000' }
          }
        ]
      };

      const result = extractFromPageModel(pageModel, []);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    test('should handle single property object', () => {
      const pageModel = {
        propertyData: {
          id: '1',
          displayAddress: 'Single Property'
        }
      };

      const result = extractFromPageModel(pageModel, []);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    test('should try alternative property data locations', () => {
      const pageModel1 = {
        properties: [{ id: '1' }]
      };

      const pageModel2 = {
        results: [{ id: '2' }]
      };

      const pageModel3 = {
        props: {
          pageProps: {
            properties: [{ id: '3' }]
          }
        }
      };

      const result1 = extractFromPageModel(pageModel1, []);
      const result2 = extractFromPageModel(pageModel2, []);
      const result3 = extractFromPageModel(pageModel3, []);

      expect(result1[0].id).toBe('1');
      expect(result2[0].id).toBe('2');
      expect(result3[0].id).toBe('3');
    });

    test('should return empty array if no propertyData found', () => {
      const pageModel = {
        someOtherData: 'value'
      };

      const result = extractFromPageModel(pageModel, []);

      expect(result).toEqual([]);
    });

    test('should return empty array if pageModel is null', () => {
      const result = extractFromPageModel(null, []);

      expect(result).toEqual([]);
    });

    test('should filter out null properties', () => {
      const pageModel = {
        propertyData: [
          { id: '1', displayAddress: 'Valid' },
          null,
          { id: '2', displayAddress: 'Also Valid' }
        ]
      };

      // Mock extractPropertyFromJS to return null for null input
      const result = extractFromPageModel(pageModel, []);

      expect(result.length).toBeGreaterThan(0);
      expect(result.every(p => p !== null)).toBe(true);
    });
  });

  describe('extractPageModel', () => {
    test('should extract PAGE_MODEL from page', async () => {
      const mockPage = {
        evaluate: jest.fn().mockResolvedValue({
          propertyData: [{ id: '1' }]
        })
      };

      const result = await extractPageModel(mockPage);

      expect(result).toEqual({
        propertyData: [{ id: '1' }]
      });
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    test('should return null if no JavaScript data found', async () => {
      const mockPage = {
        evaluate: jest.fn().mockResolvedValue(null)
      };

      const result = await extractPageModel(mockPage);

      expect(result).toBeNull();
    });

    test('should handle evaluation errors gracefully', async () => {
      const mockPage = {
        evaluate: jest.fn().mockRejectedValue(new Error('Evaluation failed'))
      };

      const result = await extractPageModel(mockPage);

      expect(result).toBeNull();
    });
  });
});
