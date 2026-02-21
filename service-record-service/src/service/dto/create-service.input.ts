import { InputType, Field, Float, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';

@InputType()
export class CreateServiceRecordInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  vin: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  serviceType: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  cost: number;

  @Field()
  @IsDateString()
  @IsNotEmpty()
  serviceDate: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  serviceProvider: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  technician?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  nextServiceDate?: string;

  @Field(() => Int, { defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  mileage?: number;
}
