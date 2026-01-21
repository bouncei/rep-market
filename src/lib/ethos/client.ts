const ETHOS_API_BASE_URL =
  process.env.ETHOS_API_BASE_URL || "https://api.ethos.network";
const ETHOS_CLIENT_ID = process.env.ETHOS_CLIENT_ID || "rep-market";

export interface EthosProfile {
  id: number;
  profileId: number;
  username: string;
  displayName: string;
  score: number;
  status: string;
  xpTotal: number;
  stats?: {
    review?: {
      received?: {
        negative: number;
        neutral: number;
        positive: number;
      };
    };
    vouch?: {
      received?: {
        count: number;
        amountWeiTotal: string;
      };
      given?: {
        count: number;
        amountWeiTotal: string;
      };
    };
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
  private accessToken?: string;

  constructor(accessToken?: string) {
    this.baseUrl = ETHOS_API_BASE_URL;
    this.clientId = ETHOS_CLIENT_ID;
    this.accessToken = accessToken;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Ethos-Client": this.clientId,
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Ethos API error: ${response.status}`);
    }

    return response.json();
  }

  async getProfileByAddress(address: string): Promise<EthosProfile | null> {
    try {
      const profile = await this.fetch<EthosProfile>(
        `/api/v2/user/by/address/${address}`
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
        credibility: profile.score, // Use score as credibility until we find the correct mapping
        profileId: profile.profileId,
      };
    } catch {
      return null;
    }
  }

  async getProfileByTwitterUsername(username: string): Promise<EthosProfile | null> {
    try {
      const profile = await this.fetch<EthosProfile>(
        `/api/v2/user/by/x/${username}`
      );
      return profile;
    } catch {
      return null;
    }
  }

  async getProfileByTwitterId(twitterId: string): Promise<EthosProfile | null> {
    try {
      const profile = await this.fetch<EthosProfile>(
        `/api/v2/user/by/x/id/${twitterId}`
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
        credibility: profile.score, // Use score as credibility until we find the correct mapping
        profileId: profile.profileId,
      };
    } catch {
      return null;
    }
  }

  async getProfileCount(): Promise<number> {
    try {
      const response = await this.fetch<{ count: number }>("/api/v2/stats/profiles");
      return response.count;
    } catch {
      return 0;
    }
  }
}

export const ethosClient = new EthosClient();
