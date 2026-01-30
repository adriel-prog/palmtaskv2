
import { Task, SKU } from './types';

export const MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: 'Main Street Liquors',
    status: 'ACTIVE',
    dueTime: 'Pending Delivery • 2:00 PM',
    description: 'Standard inventory drop-off and restocking.',
    location: 'Main Street',
    // Added mandatory sheet fields
    sectorCode: '305',
    pdvCode: 'PDV001',
    pdvName: 'Main Street Liquors',
    coins: 15,
    category: 'BEER',
    subject: 'Restock',
    operation: 'DELIVERY',
    hashId: 'hash_1',
    // Fix: Added missing cluster and flagScore properties
    cluster: 'Centro',
    flagScore: 'Não'
  },
  {
    id: '2',
    title: 'Quarterly Inventory Audit',
    status: 'OVERDUE',
    dueTime: 'Due: 2h ago',
    description: 'Complete the stock count for the main distribution center in Region A.',
    // Added mandatory sheet fields
    sectorCode: '305',
    pdvCode: 'PDV002',
    pdvName: 'Region A Warehouse',
    coins: 50,
    category: 'AUDIT',
    subject: 'Inventory',
    operation: 'AUDIT',
    hashId: 'hash_2',
    // Fix: Added missing cluster and flagScore properties
    cluster: 'Região A',
    flagScore: 'Sim'
  },
  {
    id: '3',
    title: 'New Store Onboarding',
    status: 'ACTIVE',
    dueTime: 'Today, 5:00 PM',
    description: 'Verify credentials and set up the digital storefront.',
    priority: 'HIGH',
    // Added mandatory sheet fields
    sectorCode: '305',
    pdvCode: 'PDV003',
    pdvName: 'New Store',
    coins: 25,
    category: 'NAB',
    subject: 'Onboarding',
    operation: 'SETUP',
    hashId: 'hash_3',
    // Fix: Added missing cluster and flagScore properties
    cluster: 'Sul',
    flagScore: 'Não'
  }
];

export const MOCK_SKUS: SKU[] = [
  {
    id: 's1',
    name: 'Artisan Whole Bean',
    sku: 'AWB-100',
    velocity: '+5.2%',
    unitsSold: 320,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCzgS-nqVRuaCNjygDieccxylX65wbcbpqg4YmZhUda2B0eDKVzpdqOo6o1HmuiKuwie-WEuRuO4DYVleI0W4fDW5cJ3uwA4K3ZvurBtEXWgxPBBdyFfgylsdz38u13vz6Me6VlYQJ9paFvBHuEzJC_eH8WUulz-hj_fSfgAhj7hvfqg8Cji6-L-KLEbNvfDSk296KlbszO4Ta-wMS2WngQhBZzErM9-XmfWvWPpgxBSLSdlKDVtRUgvQisM8Ar-DJy0BfYaILSNSH2'
  },
  {
    id: 's2',
    name: 'Temp Control Kettle',
    sku: 'TCK-202',
    velocity: '+8.1%',
    unitsSold: 214,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcsaTXGioY2WBy4hCwcR7CmZBvaKHYpSMkQDyOC6vFRp7PIPuN25EMM51T4GAJKY-XUvzxN7KA6HcaTQRBQ7zhlnQQHuG6YP2v6Do7ev73pG7wHOn54M_atzwx5P4OgXUQG7wvYYxolBEg3Lewzo0ebyEVxV0kLBossquXNo5hL-e4bvOSEg6UfPeL0kLrFRCQJO2DbQGord33x8jmCrbwYoveGCTMPxoS0JshGm_EpjS-UUjPrX3PyRpbwnkfBvEogws0gH2520P_'
  }
];