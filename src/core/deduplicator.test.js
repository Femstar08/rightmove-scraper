/**
 * Deduplicator Tests
 */

const Deduplicator = require('./deduplicator');

describe('Deduplicator', () => {
  describe('deduplicate', () => {
    test('should return empty array for empty input', () => {
      const result = Deduplicator.deduplicate([]);
      expect(result).toEqual([]);
    });

    test('should return same array for single property', () => {
      const properties = [{
        id: '123',
        address: 'Test Street, London',
        source: 'rightmove'
      }];

      const result = Deduplicator.deduplicate(properties);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('123');
    });

    test('should not deduplicate properties with different addresses', () => {
      const properties = [
        {
          id: '123',
          address: 'Test Street, London SW1A 1AA',
          outcode: 'SW1A',
          incode: '1AA',
          source: 'rightmove'
        },
        {
          id: '456',
          address: 'Different Street, London NW1 6XE',
          outcode: 'NW1',
          incode: '6XE',
          source: 'zoopla'
        }
      ];

      const result = Deduplicator.deduplicate(properties);
      expect(result).toHaveLength(2);
    });

    test('should deduplicate properties with same address', () => {
      const properties = [
        {
          id: '123',
          address: 'High Street, London SW1A 1AA',
          outcode: 'SW1A',
          incode: '1AA',
          price: '£350,000',
          bedrooms: 2,
          source: 'rightmove'
        },
        {
          id: '456',
          address: 'High Street, London SW1A 1AA',
          outcode: 'SW1A',
          incode: '1AA',
          price: '£350,000',
          bedrooms: 2,
          bathrooms: 1,
          source: 'zoopla'
        }
      ];

      const result = Deduplicator.deduplicate(properties);
      expect(result).toHaveLength(1);
      expect(result[0]._isDuplicate).toBe(true);
      expect(result[0].sources).toContain('rightmove');
      expect(result[0].sources).toContain('zoopla');
    });

    test('should merge fields from multiple sources', () => {
      const properties = [
        {
          id: '123',
          address: 'Test Street, London SW1A 1AA',
          outcode: 'SW1A',
          incode: '1AA',
          price: '£350,000',
          bedrooms: 2,
          description: 'Short description',
          source: 'rightmove'
        },
        {
          id: '456',
          address: 'Test Street, London SW1A 1AA',
          outcode: 'SW1A',
          incode: '1AA',
          price: '£350,000',
          bathrooms: 1,
          description: 'Much longer and more detailed description',
          source: 'zoopla'
        }
      ];

      const result = Deduplicator.deduplicate(properties);
      expect(result).toHaveLength(1);
      expect(result[0].bedrooms).toBe(2);
      expect(result[0].bathrooms).toBe(1);
      expect(result[0].description).toBe('Much longer and more detailed description');
    });

    test('should merge arrays from multiple sources', () => {
      const properties = [
        {
          id: '123',
          address: 'Test Street, London SW1A 1AA',
          outcode: 'SW1A',
          incode: '1AA',
          images: ['image1.jpg', 'image2.jpg'],
          features: ['Garden', 'Parking'],
          source: 'rightmove'
        },
        {
          id: '456',
          address: 'Test Street, London SW1A 1AA',
          outcode: 'SW1A',
          incode: '1AA',
          images: ['image2.jpg', 'image3.jpg'],
          features: ['Parking', 'Balcony'],
          source: 'zoopla'
        }
      ];

      const result = Deduplicator.deduplicate(properties);
      expect(result).toHaveLength(1);
      expect(result[0].images).toHaveLength(3);
      expect(result[0].images).toContain('image1.jpg');
      expect(result[0].images).toContain('image3.jpg');
      expect(result[0].features).toHaveLength(3);
      expect(result[0].features).toContain('Garden');
      expect(result[0].features).toContain('Balcony');
    });

    test('should keep most complete property as base', () => {
      const properties = [
        {
          id: '123',
          address: 'Test Street, London SW1A 1AA',
          outcode: 'SW1A',
          incode: '1AA',
          price: '£350,000',
          source: 'rightmove'
        },
        {
          id: '456',
          address: 'Test Street, London SW1A 1AA',
          outcode: 'SW1A',
          incode: '1AA',
          price: '£350,000',
          bedrooms: 2,
          bathrooms: 1,
          propertyType: 'Flat',
          description: 'Detailed description',
          source: 'zoopla'
        }
      ];

      const result = Deduplicator.deduplicate(properties);
      expect(result).toHaveLength(1);
      // Should use zoopla as base (more fields)
      expect(result[0].bedrooms).toBe(2);
      expect(result[0].bathrooms).toBe(1);
      expect(result[0].propertyType).toBe('Flat');
    });

    test('should handle multiple duplicate groups', () => {
      const properties = [
        {
          id: '1',
          address: 'Street A, London SW1A 1AA',
          outcode: 'SW1A',
          incode: '1AA',
          source: 'rightmove'
        },
        {
          id: '2',
          address: 'Street A, London SW1A 1AA',
          outcode: 'SW1A',
          incode: '1AA',
          source: 'zoopla'
        },
        {
          id: '3',
          address: 'Street B, London NW1 6XE',
          outcode: 'NW1',
          incode: '6XE',
          source: 'rightmove'
        },
        {
          id: '4',
          address: 'Street B, London NW1 6XE',
          outcode: 'NW1',
          incode: '6XE',
          source: 'zoopla'
        },
        {
          id: '5',
          address: 'Street C, London W1D 1BS',
          outcode: 'W1D',
          incode: '1BS',
          source: 'rightmove'
        }
      ];

      const result = Deduplicator.deduplicate(properties);
      expect(result).toHaveLength(3);
      
      const duplicates = result.filter(p => p._isDuplicate);
      expect(duplicates).toHaveLength(2);
    });

    test('should handle case-insensitive address matching', () => {
      const properties = [
        {
          id: '123',
          address: 'HIGH STREET, LONDON SW1A 1AA',
          outcode: 'SW1A',
          incode: '1AA',
          source: 'rightmove'
        },
        {
          id: '456',
          address: 'high street, london sw1a 1aa',
          outcode: 'SW1A',
          incode: '1AA',
          source: 'zoopla'
        }
      ];

      const result = Deduplicator.deduplicate(properties);
      expect(result).toHaveLength(1);
      expect(result[0]._isDuplicate).toBe(true);
    });

    test('should track all source IDs in duplicateOf', () => {
      const properties = [
        {
          id: '123',
          address: 'Test Street, London SW1A 1AA',
          outcode: 'SW1A',
          incode: '1AA',
          source: 'rightmove'
        },
        {
          id: '456',
          address: 'Test Street, London SW1A 1AA',
          outcode: 'SW1A',
          incode: '1AA',
          source: 'zoopla'
        }
      ];

      const result = Deduplicator.deduplicate(properties);
      expect(result[0].duplicateOf).toContain('123');
      expect(result[0].duplicateOf).toContain('456');
    });
  });

  describe('getStatistics', () => {
    test('should calculate correct statistics', () => {
      const original = [
        { id: '1', address: 'A' },
        { id: '2', address: 'A' },
        { id: '3', address: 'B' },
        { id: '4', address: 'C' },
        { id: '5', address: 'C' }
      ];

      const deduplicated = [
        { id: '1', address: 'A', _isDuplicate: true },
        { id: '3', address: 'B' },
        { id: '4', address: 'C', _isDuplicate: true }
      ];

      const stats = Deduplicator.getStatistics(original, deduplicated);

      expect(stats.originalCount).toBe(5);
      expect(stats.deduplicatedCount).toBe(3);
      expect(stats.duplicatesRemoved).toBe(2);
      expect(stats.duplicateGroups).toBe(2);
      expect(stats.deduplicationRate).toBe('40.00%');
    });

    test('should handle no duplicates', () => {
      const original = [
        { id: '1', address: 'A' },
        { id: '2', address: 'B' }
      ];

      const deduplicated = [
        { id: '1', address: 'A' },
        { id: '2', address: 'B' }
      ];

      const stats = Deduplicator.getStatistics(original, deduplicated);

      expect(stats.duplicatesRemoved).toBe(0);
      expect(stats.deduplicationRate).toBe('0.00%');
    });

    test('should handle empty arrays', () => {
      const stats = Deduplicator.getStatistics([], []);

      expect(stats.originalCount).toBe(0);
      expect(stats.deduplicatedCount).toBe(0);
      expect(stats.deduplicationRate).toBe('0%');
    });
  });
});
