const ETHOS_API_BASE_URL =
  process.env.ETHOS_API_BASE_URL || "https://api.ethos.network";
const ETHOS_CLIENT_ID = process.env.ETHOS_CLIENT_ID || "rep-market";

export interface EthosProfile {
  id: number;
  primaryAddress: string;
  score: number;
  credibility: number;
  reviewStats?: {
    received: number;
    given: number;
  };
  vouchStats?: {
    received: number;
    given: number;
  };
}

export interface EthosCredibility {
  score: number;
  credibility: number;
  profileId: number;
}

export class EthosClient {
  private baseUrl: string;
  private clientId: string;

  constructor() {
    this.baseUrl = ETHOS_API_BASE_URL;
    this.clientId = ETHOS_CLIENT_ID;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        "X-Ethos-Client": this.clientId,
      },
    });

    if (!response.ok) {
      throw new Error(`Ethos API error: ${response.status}`);
    }

    return response.json();
  }

  async getProfileByAddress(address: string): Promise<EthosProfile | null> {
    try {
      const profile = await this.fetch<EthosProfile>(
        `/v1/profile/address/${address}`
      );
      return profile;
    } catch {
      return null;
    }
  }

  async getCredibilityByAddress(
    address: string
  ): Promise<EthosCredibility | null> {
    try {
      const profile = await this.getProfileByAddress(address);
      if (!profile) return null;

      return {
        score: profile.score,
        credibility: profile.credibility,
        profileId: profile.id,
      };
    } catch {
      return null;
    }
  }

  async getProfileByTwitterUsername(username: string): Promise<EthosProfile | null> {
    try {
      const userKey = `service:x.com:username:${username}`;
      const profile = await this.fetch<EthosProfile>(
        `/v1/user/by/address/${encodeURIComponent(userKey)}`
      );
      return profile;
    } catch {
      return null;
    }
  }

  async getProfileByTwitterId(twitterId: string): Promise<EthosProfile | null> {
    try {
      const userKey = `service:x.com:${twitterId}`;
      const profile = await this.fetch<EthosProfile>(
        `/v1/user/by/address/${encodeURIComponent(userKey)}`
      );
      return profile;
    } catch {
      return null;
    }
  }

  async getCredibilityBySocialId(
    platform: 'x.com', 
    identifier: string,
    identifierType: 'id' | 'username' = 'username'
  ): Promise<EthosCredibility | null> {
    try {
      let profile: EthosProfile | null = null;
      
      if (platform === 'x.com' && identifierType === 'username') {
        profile = await this.getProfileByTwitterUsername(identifier);
      } else if (platform === 'x.com' && identifierType === 'id') {
        profile = await this.getProfileByTwitterId(identifier);
      }

      if (!profile) return null;

      return {
        score: profile.score,
        credibility: profile.credibility,
        profileId: profile.id,
      };
    } catch {
      return null;
    }
  }

  async getProfileCount(): Promise<number> {
    try {
      const response = await this.fetch<{ count: number }>("/v1/stats/profiles");
      return response.count;
    } catch {
      return 0;
    }
  }
}

export const ethosClient = new EthosClient();
