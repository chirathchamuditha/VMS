import { ObjectType, Field, Directive } from "@nestjs/graphql";

@ObjectType()
@Directive('@extends')
@Directive('@key(fields: "vin")')
export class Vehicle {

    @Field()
    @Directive('@external')
    vin: string;
}