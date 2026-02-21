import { Field, InputType, Int } from "@nestjs/graphql";
import { Min, IsString, IsOptional } from "class-validator";


@InputType()
export class PaginationInput {

    @Field(() => Int, { defaultValue: 1})
    @Min(1)
    page: number = 1

    @Field(() => Int, { defaultValue: 100})
    @Min(1)
    limit: number = 100
}


@InputType()
export class SearchInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  model?: string;
}