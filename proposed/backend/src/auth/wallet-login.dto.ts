import { IsString, IsNotEmpty, IsEthereumAddress } from 'class-validator';

export class WalletLoginDto {
  @IsEthereumAddress()
  @IsNotEmpty()
  walletAddress: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
