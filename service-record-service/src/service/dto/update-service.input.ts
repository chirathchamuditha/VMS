import { Field, ID, InputType, PartialType } from "@nestjs/graphql";
import {CreateServiceRecordInput } from "./create-service.input";
import { IsNotEmpty, IsUUID } from 'class-validator';


@InputType()
export class UpdateServiceInput extends PartialType(CreateServiceRecordInput) {

    @Field(() => ID)
    @IsUUID()
    @IsNotEmpty()
    id: string;
}