import axios, { AxiosInstance } from 'axios';
import { encryptEntitySecret } from "./utils/helpers"

const API_URL = 'https://api.circle.com/v1/w3s';

interface WalletSetResponse {
  data: {
    walletSet: {
      id: string;
      custodyType: string;
      updateDate: Date;
      createDate: Date;
    };
  };
}

interface PublicKeyResponse {
  data: {
    publicKey: string;
  };
}

class CircleEIP1193Provider {
  private apiKey: string;
  private entitySecret: string;
  private client: AxiosInstance;
  private publicKey: string | undefined;

  private constructor(apiKey: string, entitySecret: string) {
    this.apiKey = apiKey;
    this.entitySecret = entitySecret;
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });
  }

  async fetchPublicKey(): Promise<string | undefined> {
    try {
      const response = await this.client.get<PublicKeyResponse>('/config/entity/publicKey');
      console.log(response);
      return response.data.data.publicKey;
    } catch (error) {
      console.error('Error fetching public key:', error);
      return undefined;
    }
  }

  async createWalletSet(publicKey: string): Promise<string | undefined> {
    try {
      const encryptedEntitySecret = encryptEntitySecret(publicKey);
      const data = {entitySecretCiphertext: encryptedEntitySecret, idempotencyKey: '85caf545-770c-429a-8eaa-72d8f01974c3', name: 'Wallet Set A'};
      const response = await this.client.post('/developer/walletSets', data)
      console.log(response);
      return response.data.data.walletSet.id;
    } catch (error) {
      console.error('Error creating wallet set:', error);
      return undefined;
    }
  }

  public static async create(apiKey: string, entitySecret: string): Promise<CircleEIP1193Provider> {
    const instance = new CircleEIP1193Provider(apiKey, entitySecret);
    const publicKey = await instance.fetchPublicKey();
    if (!publicKey) {
      throw new Error('Failed to fetch public key');
    }
    instance.publicKey = publicKey;
    
    const walletSetId = await instance.createWalletSet(publicKey);
    if (!walletSetId) {
      throw new Error('Failed to get wallet set Id');
    }

    return instance;
  }
}

export default CircleEIP1193Provider;