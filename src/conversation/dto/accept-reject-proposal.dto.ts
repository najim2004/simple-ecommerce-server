import { IsBoolean, IsNotEmpty } from 'class-validator';

export class AcceptRejectProposalDto {
  @IsBoolean()
  @IsNotEmpty()
  accepted: boolean;
}
