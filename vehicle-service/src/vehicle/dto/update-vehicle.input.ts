import { Field, InputType, PartialType } from "@nestjs/graphql";
import { CreateVehicleInput } from "./create-vehicle.input";
import { IsNotEmpty, IsUUID } from "class-validator";

@InputType()
export class UpdatedVehicleInput extends PartialType(CreateVehicleInput) {

    @Field()
    @IsUUID()
    @IsNotEmpty()
    id: string
}