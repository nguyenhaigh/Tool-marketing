
export enum Sentiment {
  Positive = 'Positive',
  Negative = 'Negative',
  Neutral = 'Neutral',
}

export enum Topic {
  Campaign = 'Campaign',
  Shipping = 'Shipping',
  Price = 'Price',
  ProductQuality = 'Product Quality',
  CustomerService = 'Customer Service',
  General = 'General',
}

export interface Insight {
  id: string;
  timestamp: string;
  source_url: string;
  raw_content: string;
  sentiment?: Sentiment;
  topic?: Topic;
}
