import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Vehicle } from '../entities/vehicle.entity';

@ObjectType()
export class PaginatedVehiclesResponse {
  @Field(() => [Vehicle])
  vehicles: Vehicle[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;

  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;
}