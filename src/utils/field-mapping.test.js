const {
  validateUnifiedSchema,
  setMissingFieldsToNull,
  extractPostcode,
  normalizeAddress,
  normalizePrice,
  validateFieldType,
  mergeProperties,
  getSchema,
  getRequiredFields
} = require('./field-mapping');

describe('Field Mapping Utilities', () => {
  describe('validateUnifiedSchema', () => {
    test('validates valid property', () => {
      const property = {
        id: '123',
        url: 'https://example.com/property/123',
        source: 'rightmove',
        address: '123 Test Street',
        price: '£250,000'
      };

      const result = validateUnifiedSchema(property);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('detects missing required fields', () => {
      const property = {
        id: '123',
        url: 'https://example.com/property/123'
        // Missing: source, address, price
      };

      const result = validateUnifiedSchema(property);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Required field missing: source');
      expect(result.errors).toContain('Required field missing: address');
      expect(result.errors).toContain('Required field missing: price');
    });

    test('warns about incorrect field types', () => {
      const property = {
        id: '123',
        url: 'https://example.com/property/123',
        source: 'rightmove',
        address: '123 Test Street',
        price: '£250,000',
        bedrooms: '3', // Should be number
        images: 'image.jpg' // Should be array
      };

      const result = validateUnifiedSchema(property);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('bedrooms'))).toBe(true);
      expect(result.warnings.some(w => w.includes('images'))).toBe(true);
    });

    test('warns about unknown fields', () => {
      const property = {
        id: '123',
        url: 'https://example.com/property/123',
        source: 'rightmove',
        address: '123 Test Street',
        price: '£250,000',
        unknownField: 'value'
      };

      const result = validateUnifiedSchema(property);
      expect(result.warnings.some(w => w.includes('unknownField'))).toBe(true);
    });

    test('throws in strict mode', () => {
      const property = {
        id: '123'
        // Missing required fields
      };

      expect(() => {
        validateUnifiedSchema(property, true);
      }).toThrow('Schema validation failed');
    });

    test('handles null property', () => {
      const result = validateUnifiedSchema(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Property must be an object');
    });
  });

  describe('setMissingFieldsToNull', () => {
    test('adds missing fields with appropriate defaults', () => {
      const property = {
        id: '123',
        url: 'https://example.com/property/123',
        source: 'rightmove',
        address: '123 Test Street',
        price: '£250,000'
      };

      const normalized = setMissingFieldsToNull(property);

      expect(normalized.id).toBe('123');
      expect(normalized.bedrooms).toBeNull();
      expect(normalized.images).toEqual([]);
      expect(normalized.coordinates).toBeNull();
      expect(normalized.published).toBe(false);
    });

    test('preserves existing fields', () => {
      const property = {
        id: '123',
        url: 'https://example.com/property/123',
        source: 'rightmove',
        address: '123 Test Street',
        price: '£250,000',
        bedrooms: 3,
        images: ['image1.jpg', 'image2.jpg']
      };

      const normalized = setMissingFieldsToNull(property);

      expect(normalized.bedrooms).toBe(3);
      expect(normalized.images).toEqual(['image1.jpg', 'image2.jpg']);
    });
  });

  describe('extractPostcode', () => {
    test('extracts postcode from full address', () => {
      const address = '123 Test Street, London, SW1A 1AA';
      const result = extractPostcode(address);

      expect(result).not.toBeNull();
      expect(result.outcode).toBe('SW1A');
      expect(result.incode).toBe('1AA');
      expect(result.full).toBe('SW1A 1AA');
    });

    test('extracts postcode without space', () => {
      const postcode = 'SW1A1AA';
      const result = extractPostcode(postcode);

      expect(result).not.toBeNull();
      expect(result.outcode).toBe('SW1A');
      expect(result.incode).toBe('1AA');
    });

    test('handles various postcode formats', () => {
      const postcodes = [
        'M1 1AA',
        'M60 1NW',
        'CR2 6XH',
        'DN55 1PT',
        'W1A 1HQ',
        'EC1A 1BB'
      ];

      postcodes.forEach(postcode => {
        const result = extractPostcode(postcode);
        expect(result).not.toBeNull();
        expect(result.full).toBeTruthy();
      });
    });

    test('returns null for invalid postcode', () => {
      expect(extractPostcode('No postcode here')).toBeNull();
      expect(extractPostcode('')).toBeNull();
      expect(extractPostcode(null)).toBeNull();
    });

    test('extracts first postcode from multiple', () => {
      const address = 'From SW1A 1AA to W1A 1HQ';
      const result = extractPostcode(address);

      expect(result.outcode).toBe('SW1A');
      expect(result.incode).toBe('1AA');
    });
  });

  describe('normalizeAddress', () => {
    test('trims whitespace', () => {
      const address = '  123 Test Street  ';
      expect(normalizeAddress(address)).toBe('123 Test Street');
    });

    test('collapses multiple spaces', () => {
      const address = '123  Test   Street';
      expect(normalizeAddress(address)).toBe('123 Test Street');
    });

    test('removes double commas', () => {
      const address = '123 Test Street,, London';
      expect(normalizeAddress(address)).toBe('123 Test Street, London');
    });

    test('removes trailing comma', () => {
      const address = '123 Test Street,';
      expect(normalizeAddress(address)).toBe('123 Test Street');
    });

    test('handles null/undefined', () => {
      expect(normalizeAddress(null)).toBe('');
      expect(normalizeAddress(undefined)).toBe('');
    });
  });

  describe('normalizePrice', () => {
    test('formats number to price string', () => {
      expect(normalizePrice(250000)).toBe('£250,000');
      expect(normalizePrice(1500000)).toBe('£1,500,000');
    });

    test('preserves already formatted price', () => {
      expect(normalizePrice('£250,000')).toBe('£250,000');
    });

    test('extracts and formats from string', () => {
      expect(normalizePrice('250000')).toBe('£250,000');
      expect(normalizePrice('Offers over £250,000')).toBe('£250,000');
    });

    test('handles null/undefined', () => {
      expect(normalizePrice(null)).toBeNull();
      expect(normalizePrice(undefined)).toBeNull();
    });

    test('handles non-numeric strings', () => {
      const result = normalizePrice('POA');
      expect(result).toBe('POA');
    });
  });

  describe('validateFieldType', () => {
    test('validates string type', () => {
      expect(validateFieldType('test', 'string')).toBe(true);
      expect(validateFieldType(123, 'string')).toBe(false);
    });

    test('validates number type', () => {
      expect(validateFieldType(123, 'number')).toBe(true);
      expect(validateFieldType('123', 'number')).toBe(false);
    });

    test('validates array type', () => {
      expect(validateFieldType([], 'array')).toBe(true);
      expect(validateFieldType([1, 2, 3], 'array')).toBe(true);
      expect(validateFieldType('array', 'array')).toBe(false);
    });

    test('validates object type', () => {
      expect(validateFieldType({}, 'object')).toBe(true);
      expect(validateFieldType({ key: 'value' }, 'object')).toBe(true);
      expect(validateFieldType([], 'object')).toBe(false); // Arrays are not objects
    });

    test('validates boolean type', () => {
      expect(validateFieldType(true, 'boolean')).toBe(true);
      expect(validateFieldType(false, 'boolean')).toBe(true);
      expect(validateFieldType('true', 'boolean')).toBe(false);
    });

    test('allows null/undefined for any type', () => {
      expect(validateFieldType(null, 'string')).toBe(true);
      expect(validateFieldType(undefined, 'number')).toBe(true);
    });
  });

  describe('mergeProperties', () => {
    test('returns single property unchanged', () => {
      const property = {
        id: '123',
        source: 'rightmove',
        address: '123 Test Street'
      };

      const merged = mergeProperties([property]);
      expect(merged).toEqual(property);
    });

    test('merges two properties', () => {
      const prop1 = {
        id: '123',
        source: 'rightmove',
        address: '123 Test Street',
        price: '£250,000',
        bedrooms: 3
      };

      const prop2 = {
        id: '456',
        source: 'zoopla',
        address: '123 Test Street, London',
        price: '£250,000',
        description: 'Beautiful property'
      };

      const merged = mergeProperties([prop1, prop2]);

      expect(merged.sources).toEqual(['rightmove', 'zoopla']);
      expect(merged.duplicateOf).toEqual(['123', '456']);
      expect(merged._isDuplicate).toBe(true);
      expect(merged.bedrooms).toBe(3);
      expect(merged.description).toBe('Beautiful property');
      expect(merged.address).toBe('123 Test Street, London'); // Longer string
    });

    test('merges arrays', () => {
      const prop1 = {
        id: '123',
        source: 'rightmove',
        images: ['image1.jpg', 'image2.jpg']
      };

      const prop2 = {
        id: '456',
        source: 'zoopla',
        images: ['image2.jpg', 'image3.jpg']
      };

      const merged = mergeProperties([prop1, prop2]);

      expect(merged.images).toHaveLength(3);
      expect(merged.images).toContain('image1.jpg');
      expect(merged.images).toContain('image2.jpg');
      expect(merged.images).toContain('image3.jpg');
    });

    test('prefers non-null values', () => {
      const prop1 = {
        id: '123',
        source: 'rightmove',
        bedrooms: null,
        bathrooms: 2
      };

      const prop2 = {
        id: '456',
        source: 'zoopla',
        bedrooms: 3,
        bathrooms: null
      };

      const merged = mergeProperties([prop1, prop2]);

      expect(merged.bedrooms).toBe(3);
      expect(merged.bathrooms).toBe(2);
    });

    test('handles empty array', () => {
      expect(mergeProperties([])).toBeNull();
    });

    test('handles null input', () => {
      expect(mergeProperties(null)).toBeNull();
    });
  });

  describe('getSchema and getRequiredFields', () => {
    test('getSchema returns schema object', () => {
      const schema = getSchema();
      expect(schema).toBeDefined();
      expect(schema.id).toBe('string');
      expect(schema.source).toBe('string');
    });

    test('getRequiredFields returns array', () => {
      const required = getRequiredFields();
      expect(Array.isArray(required)).toBe(true);
      expect(required).toContain('id');
      expect(required).toContain('url');
      expect(required).toContain('source');
    });
  });
});
