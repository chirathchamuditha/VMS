import { Field, InputType } from "@nestjs/graphql"

@InputType()
export class CreateVehicleInput {
    @Field()
    
        @Field()
        firstName: string;
    
        @Field()
        lastName: string;
    
        @Field()
        email: string;
    
        @Field()
        carMake: string;
    
        @Field()
        carModel: string;
    
        @Field()
        vin: string;
    
        @Field()
        manufacturedDate: Date;
}